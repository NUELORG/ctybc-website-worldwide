import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { get, put } from '@vercel/blob';

export const CONTENT_PATH = 'ctybc-cms/content-v1.json';
export const SESSION_COOKIE = 'ctybc_admin_session';
export const SESSION_SECONDS = 60 * 60 * 8;

export function json(data, status = 200, headers = {}) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

export function configReady() {
  const blobConfigured = process.env.BLOB_READ_WRITE_TOKEN || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN);
  return Boolean(process.env.CMS_ADMIN_PASSWORD && process.env.CMS_SESSION_SECRET && blobConfigured);
}

function signature(value) {
  return createHmac('sha256', process.env.CMS_SESSION_SECRET).update(value).digest('base64url');
}

export function createSession() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `${expires}.${randomUUID()}`;
  return `${payload}.${signature(payload)}`;
}

export function validSession(request) {
  if (!process.env.CMS_SESSION_SECRET) return false;
  const raw = request.headers.get('cookie') || '';
  const token = raw.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1);
  if (!token) return false;
  const [expires, nonce, supplied] = token.split('.');
  if (!expires || !nonce || !supplied || Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const payload = `${expires}.${nonce}`;
  const expected = Buffer.from(signature(payload));
  const received = Buffer.from(supplied);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try { return new URL(origin).host === new URL(request.url).host; }
  catch { return false; }
}

export function cookieHeader(token, request) {
  const secure = new URL(request.url).protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure ? '; Secure' : ''}`;
}

export function clearCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`;
}

export async function readContent() {
  const blob = await get(CONTENT_PATH, { access: 'public', useCache: false });
  if (!blob || blob.statusCode !== 200 || !blob.stream) {
    return { version: 1, updatedAt: null, patches: {}, gallery: [] };
  }
  const text = await new Response(blob.stream).text();
  const content = JSON.parse(text);
  return {
    version: 1,
    updatedAt: content.updatedAt || null,
    patches: content.patches && typeof content.patches === 'object' ? content.patches : {},
    gallery: Array.isArray(content.gallery) ? content.gallery : [],
  };
}

export async function writeContent(content) {
  const safe = {
    version: 1,
    updatedAt: new Date().toISOString(),
    patches: content.patches && typeof content.patches === 'object' ? content.patches : {},
    gallery: Array.isArray(content.gallery) ? content.gallery : [],
  };
  const prior = await get(CONTENT_PATH, { access: 'public', useCache: false });
  const options = {
    access: 'public',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json; charset=utf-8',
    cacheControlMaxAge: 60,
  };
  if (prior?.blob?.etag) options.ifMatch = prior.blob.etag;
  const blob = await put(CONTENT_PATH, JSON.stringify(safe), options);
  return { ...safe, etag: blob.etag };
}

export function sanitizeUploadName(name) {
  const base = String(name || 'photo').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-120);
  return base || 'photo';
}
