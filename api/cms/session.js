import { timingSafeEqual } from 'node:crypto';
import { configReady, cookieHeader, clearCookie, createSession, json, sameOrigin, validSession } from '../../lib/cms.js';

const attempts = new Map();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;
function limited(request) {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_ATTEMPTS) return true;
  recent.push(now); attempts.set(key, recent);
  if (attempts.size > 2000) attempts.clear();
  return false;
}

export async function GET(request) {
  if (!configReady()) return json({ configured: false, authenticated: false }, 200);
  return json({ configured: true, authenticated: validSession(request) });
}

export async function POST(request) {
  if (!configReady()) return json({ error: 'Admin is not configured yet.' }, 503);
  if (!sameOrigin(request)) return json({ error: 'Request origin rejected.' }, 403);
  if (limited(request)) return json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' }, 429, { 'Retry-After': '900' });
  if (Number(request.headers.get('content-length') || 0) > 8192) return json({ error: 'Invalid request.' }, 400);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid request.' }, 400); }
  if (String(body.password || '').length > 4096) return json({ error: 'The password was not accepted.' }, 401);
  const expected = Buffer.from(process.env.CMS_ADMIN_PASSWORD);
  const supplied = Buffer.from(String(body.password || ''));
  const matches = expected.length === supplied.length && timingSafeEqual(expected, supplied);
  if (!matches) return json({ error: 'The password was not accepted.' }, 401);
  const token = createSession();
  return json({ authenticated: true }, 200, { 'Set-Cookie': cookieHeader(token, request) });
}

export async function DELETE(request) {
  if (!sameOrigin(request)) return json({ error: 'Request origin rejected.' }, 403);
  return json({ authenticated: false }, 200, { 'Set-Cookie': clearCookie(request) });
}
