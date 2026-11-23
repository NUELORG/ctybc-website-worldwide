import { randomUUID } from 'node:crypto';
import { put } from '@vercel/blob';
import { configReady, json, sameOrigin, sanitizeUploadName, validSession } from '../../lib/cms.js';

const MAX_UPLOAD = 4 * 1024 * 1024;
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

export async function POST(request) {
  if (!configReady()) return json({ error: 'CMS storage is not configured yet.' }, 503);
  if (!sameOrigin(request)) return json({ error: 'Request origin rejected.' }, 403);
  if (!validSession(request)) return json({ error: 'Sign in again to upload photos.' }, 401);
  let form;
  try { form = await request.formData(); } catch { return json({ error: 'Choose a valid image file.' }, 400); }
  const file = form.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') return json({ error: 'Choose an image to upload.' }, 400);
  if (!ALLOWED.has(file.type)) return json({ error: 'Use a JPG, PNG, WebP, GIF or AVIF image.' }, 415);
  if (file.size > MAX_UPLOAD) return json({ error: 'Each photo must be 4 MB or smaller.' }, 413);
  try {
    const blob = await put(`ctybc-cms/photos/${randomUUID()}-${sanitizeUploadName(file.name)}`, file, {
      access: 'public', addRandomSuffix: false, contentType: file.type, cacheControlMaxAge: 31536000,
    });
    return json({ url: blob.url, pathname: blob.pathname, contentType: blob.contentType });
  } catch { return json({ error: 'The photo could not be uploaded.' }, 503); }
}
