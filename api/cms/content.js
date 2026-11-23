import { configReady, json, readContent, sameOrigin, validSession, writeContent } from '../../lib/cms.js';

export async function GET() {
  if (!configReady()) return json({ error: 'CMS storage is not configured yet.' }, 503);
  try { return json(await readContent(), 200, { 'Cache-Control': 'no-store' }); }
  catch { return json({ error: 'Saved site content could not be loaded.' }, 503); }
}

export async function PUT(request) {
  if (!configReady()) return json({ error: 'CMS storage is not configured yet.' }, 503);
  if (!sameOrigin(request)) return json({ error: 'Request origin rejected.' }, 403);
  if (!validSession(request)) return json({ error: 'Sign in again to save changes.' }, 401);
  const bodyText = await request.text();
  if (bodyText.length > 2_000_000) return json({ error: 'This content update is too large.' }, 413);
  let content;
  try { content = JSON.parse(bodyText); } catch { return json({ error: 'Invalid content document.' }, 400); }
  if (!content || typeof content !== 'object' || Array.isArray(content)) return json({ error: 'Invalid content document.' }, 400);
  if (!content.patches || typeof content.patches !== 'object' || Array.isArray(content.patches) || !Array.isArray(content.gallery)) return json({ error: 'Invalid content document.' }, 400);
  if (Object.keys(content.patches).length > 80 || content.gallery.length > 2000) return json({ error: 'This content update is too large.' }, 413);
  try { return json(await writeContent(content)); }
  catch (error) {
    if (error?.name === 'BlobPreconditionFailedError') return json({ error: 'Another save arrived first. Reload the editor and try again.' }, 409);
    return json({ error: 'Site content could not be saved.' }, 503);
  }
}
