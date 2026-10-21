const crypto = require('crypto');
const { list, put } = require('@vercel/blob');

const CONTENT_PREFIX = 'site-content/';
const PAGES = new Set([
  'about.html',
  'blog.html',
  'contact.html',
  'events.html',
  'faq.html',
  'gallery.html',
  'get-involved.html',
  'impact.html',
  'index.html',
  'partners.html',
  'programs.html',
  'team.html',
  'testimonials.html',
  'thank-you.html',
  'what-we-do.html'
]);
const MAX_CONTENT_BYTES = 150000;
const MAX_TEXT_LENGTH = 10000;
const MAX_TEXT_ENTRIES = 3000;

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function getPage(req) {
  const url = new URL(req.url, 'http://localhost');
  const page = url.searchParams.get('page') || '';
  return PAGES.has(page) ? page : null;
}

function hasValidEditToken(req) {
  const expected = process.env.SITE_CONTENT_EDIT_TOKEN;
  const authorization = req.headers.authorization || '';
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!expected || !match) return false;

  const suppliedBuffer = Buffer.from(match[1]);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(suppliedBuffer, expectedBuffer);
}

function parseBody(req) {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      return null;
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_CONTENT_BYTES) return null;
  return body;
}

async function getLatestContent(page) {
  const prefix = CONTENT_PREFIX + page.replace(/\.html$/, '') + '-';
  const blobs = [];
  let cursor;
  let hasMore;

  do {
    const result = await list({ prefix: prefix, cursor: cursor });
    blobs.push(...result.blobs);
    cursor = result.cursor;
    hasMore = result.hasMore;
  } while (hasMore);

  if (blobs.length === 0) return {};
  blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

  const response = await fetch(blobs[0].url, { cache: 'no-store' });
  if (!response.ok) throw new Error('Unable to retrieve the latest published page text.');
  const saved = await response.json();
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) {
    throw new Error('The published page text has an invalid format.');
  }
  return saved;
}

async function publishContent(page, content) {
  const pathname = CONTENT_PREFIX + page.replace(/\.html$/, '') + '-' +
    Date.now() + '-' + crypto.randomBytes(6).toString('hex') + '.json';
  await put(pathname, JSON.stringify(content), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false
  });
}

module.exports = async function siteContent(req, res) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    sendJson(res, 503, { error: 'Shared page text storage is not configured.' });
    return;
  }

  if (req.method === 'GET') {
    const page = getPage(req);
    if (!page) {
      sendJson(res, 400, { error: 'A valid page name is required.' });
      return;
    }

    try {
      const content = await getLatestContent(page);
      sendJson(res, 200, { content: content });
    } catch (error) {
      console.error('Unable to load published page text:', error);
      sendJson(res, 500, { error: 'Published page text could not be loaded.' });
    }
    return;
  }

  if (req.method === 'POST') {
    if (!process.env.SITE_CONTENT_EDIT_TOKEN) {
      sendJson(res, 503, { error: 'Site text editing is not configured.' });
      return;
    }
    if (!hasValidEditToken(req)) {
      sendJson(res, 401, { error: 'A valid site admin token is required.' });
      return;
    }

    const body = parseBody(req);
    if (!body) {
      sendJson(res, 400, { error: 'The request body must be valid JSON under 150 KB.' });
      return;
    }
    if (!PAGES.has(body.page)) {
      sendJson(res, 400, { error: 'A valid page name is required.' });
      return;
    }
    if (body.verifyOnly === true) {
      sendJson(res, 200, { success: true });
      return;
    }
    if (!body.content || typeof body.content !== 'object' || Array.isArray(body.content)) {
      sendJson(res, 400, { error: 'Page text must be provided as a key-value object.' });
      return;
    }

    const entries = Object.entries(body.content);
    if (entries.length > MAX_TEXT_ENTRIES || entries.some(([key, value]) =>
      !/^\d+$/.test(key) || typeof value !== 'string' || value.length > MAX_TEXT_LENGTH)) {
      sendJson(res, 400, { error: 'Page text contains an invalid key or value.' });
      return;
    }

    try {
      await publishContent(body.page, body.content);
      sendJson(res, 201, { success: true });
    } catch (error) {
      console.error('Unable to publish page text:', error);
      sendJson(res, 500, { error: 'Page text could not be published.' });
    }
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  sendJson(res, 405, { error: 'Method not allowed.' });
};
