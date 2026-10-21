const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { list, put } = require('@vercel/blob');
const { formidable } = require('formidable');

const GALLERY_PREFIX = 'gallery/tree-planting-2026/';
const MAX_IMAGE_SIZE = 4 * 1024 * 1024;
const IMAGE_TYPES = {
  '.jpg': { mime: 'image/jpeg', signature: (data) => data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff },
  '.jpeg': { mime: 'image/jpeg', signature: (data) => data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff },
  '.png': { mime: 'image/png', signature: (data) => data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  '.webp': { mime: 'image/webp', signature: (data) => data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP' }
};

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function hasValidUploadToken(req) {
  const expected = process.env.GALLERY_UPLOAD_TOKEN;
  const authorization = req.headers.authorization || '';
  const match = /^Bearer (.+)$/.exec(authorization);
  if (!expected || !match) return false;

  const suppliedBuffer = Buffer.from(match[1]);
  const expectedBuffer = Buffer.from(expected);
  return suppliedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(suppliedBuffer, expectedBuffer);
}

function parseUpload(req) {
  const form = formidable({
    maxFiles: 1,
    maxFileSize: MAX_IMAGE_SIZE,
    maxTotalFileSize: MAX_IMAGE_SIZE,
    allowEmptyFiles: false
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(files.image);
    });
  });
}

async function listImages(res) {
  const blobs = [];
  let cursor;
  let hasMore;

  do {
    const result = await list({ prefix: GALLERY_PREFIX, cursor });
    blobs.push(...result.blobs);
    cursor = result.cursor;
    hasMore = result.hasMore;
  } while (hasMore);

  blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  sendJson(res, 200, {
    images: blobs.map((blob) => ({
      url: blob.url,
      filename: path.basename(blob.pathname).replace(/^\d+-[a-f0-9]+-/, '')
    }))
  });
}

async function uploadImage(req, res) {
  if (!process.env.GALLERY_UPLOAD_TOKEN) {
    sendJson(res, 503, { error: 'Gallery upload authentication is not configured.' });
    return;
  }
  if (!hasValidUploadToken(req)) {
    sendJson(res, 401, { error: 'A valid admin upload token is required.' });
    return;
  }

  let file;
  try {
    const files = await parseUpload(req);
    file = Array.isArray(files) ? files[0] : files;
    if (!file || !file.filepath || !file.originalFilename) {
      sendJson(res, 400, { error: 'Choose one image file to upload.' });
      return;
    }

    const extension = path.extname(file.originalFilename).toLowerCase();
    const imageType = IMAGE_TYPES[extension];
    if (!imageType || file.mimetype !== imageType.mime || file.size > MAX_IMAGE_SIZE) {
      sendJson(res, 415, { error: 'Use a JPG, PNG, or WebP image no larger than 4 MB.' });
      return;
    }

    const image = await fs.promises.readFile(file.filepath);
    if (!imageType.signature(image)) {
      sendJson(res, 415, { error: 'The selected file does not contain a valid image.' });
      return;
    }

    const filename = path.basename(file.originalFilename).replace(/[^a-zA-Z0-9._-]/g, '-');
    const pathname = GALLERY_PREFIX + Date.now() + '-' + crypto.randomBytes(4).toString('hex') + '-' + filename;
    const blob = await put(pathname, image, {
      access: 'public',
      contentType: imageType.mime,
      addRandomSuffix: false
    });

    sendJson(res, 201, { success: true, uploaded: 1, image: { url: blob.url, filename } });
  } catch (error) {
    if (error.httpCode === 413 || error.code === 1009) {
      sendJson(res, 413, { error: 'Each image must be no larger than 4 MB.' });
      return;
    }
    console.error('Gallery image upload failed:', error);
    sendJson(res, 500, { error: 'The image could not be uploaded. Please try again.' });
  } finally {
    if (file && file.filepath) {
      await fs.promises.unlink(file.filepath).catch((error) => {
        if (error.code !== 'ENOENT') console.error('Unable to remove temporary image upload:', error);
      });
    }
  }
}

module.exports = async function galleryImages(req, res) {
  if (req.method === 'GET') {
    try {
      await listImages(res);
    } catch (error) {
      console.error('Unable to list Tree Planting Day images:', error);
      sendJson(res, 500, { error: 'Uploaded photos could not be loaded right now.' });
    }
    return;
  }

  if (req.method === 'POST') {
    await uploadImage(req, res);
    return;
  }

  res.setHeader('Allow', 'GET, POST');
  sendJson(res, 405, { error: 'Method not allowed.' });
};

module.exports.config = {
  api: {
    bodyParser: false
  }
};
