const { put, del } = require('@vercel/blob');
const path = require('path');

// Upload video buffer to Vercel Blob
const uploadVideoToBlob = async (buffer, originalName, mimetype) => {
  const ext      = path.extname(originalName);
  const baseName = path.basename(originalName, ext).replace(/\s+/g, '-');
  const filename = `videos/${Date.now()}-${baseName}${ext}`;

  const blob = await put(filename, buffer, {
    access:      'public',
    contentType: mimetype,
  });

  return {
    url:      blob.url,         // public URL to stream/play
    pathname: blob.pathname,    // used for deletion later
  };
};

// Delete a blob by URL
const deleteBlob = async (url) => {
  try {
    await del(url);
  } catch (err) {
    console.warn('Blob deletion failed:', err.message);
  }
};

module.exports = { uploadVideoToBlob, deleteBlob };