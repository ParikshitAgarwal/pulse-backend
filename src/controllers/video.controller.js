const Video = require('../models/Video.model');
const {
  uploadVideoToBlob,
  deleteBlob
} = require('../services/blob.service');
const {
  validateVideo,
  getVideoMetadata
} = require('../services/ffmpeg.service');
const {
  analyzeVideo
} = require('../services/sensitivity.service');
const fs = require('fs');
const https = require('https');
const http = require('http');

exports.uploadVideo = async (req, res) => {
  try {
    const {
      title
    } = req.body;
    const file = req.file;


    const isValid = await validateVideo(file.buffer);
    if (!isValid) {
      fs.unlinkSync(file.path); // delete the fake file
      return res.status(400).json({
        message: 'Invalid video file — could not read video stream'
      });
    }

    const meta = await getVideoMetadata(file.buffer);

    const {
      url: videoUrl,
      pathname
    } = await uploadVideoToBlob(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    const video = await Video.create({
      title: title || file.originalname,
      filename: pathname,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: videoUrl,
      uploadedBy: req.user._id,
      organisation: req.user.organisation,
      status: 'processing',
      accessRoles: ['viewer', 'editor', 'admin'],
      duration: meta.duration,
      videoCodec: meta.videoCodec,
      audioCodec: meta.audioCodec,
      bitrate: meta.bitrate,
    });
    // Start async processing for  Sensitivity analysis
    analyzeVideo(video._id, req.io);
    res.status(201).json({
      message: 'Upload successful, processing started',
      video
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.getVideos = async (req, res) => {
  try {
    const filter = {
      organisation: req.user.organisation
    };
    if (req.query.status) filter.status = req.query.status;
    const videos = await Video.find(filter)
      .populate('uploadedBy', 'name email') // populated user details 
      .sort({
        createdAt: -1
      });
    res.json(videos);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      organisation: req.user.organisation
    }).populate('uploadedBy', 'name email');
    if (!video) return res.status(404).json({
      message: 'Video not found'
    });
    res.json(video);
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
}

exports.streamVideo = async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      organisation: req.user.organisation
    });
    if (!video) return res.status(404).json({
      message: 'Video not found'
    });

    const blobUrl = video.path; // Vercel Blob public URL
    const range = req.headers.range;
    const fileSize = video.size;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      if (start >= fileSize || end >= fileSize) {
        res.status(416).set({
          'Content-Range': `bytes */${fileSize}`
        }).end();
        return;
      }
      const chunkSize = end - start + 1;

      const protocol = blobUrl.startsWith('https') ? https : http;

      const blobReq = protocol.get(blobUrl, {
        headers: {
          Range: `bytes=${start}-${end}`
        }
      }, (blobRes) => {

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': video.mimetype,
          'Cache-Control': 'no-cache',
        });

        blobRes.pipe(res);

        blobRes.on('error', (err) => {
          console.error('[Stream] Blob response error:', err.message);
          res.end();
        });
      });

      blobReq.on('error', (err) => {
        console.error('[Stream] Blob request error:', err.message);
        res.status(500).json({
          message: 'Streaming failed'
        });
      });

      req.on('close', () => {
        blobReq.destroy();
      });
    } else {
      const protocol = url.startsWith('https') ? https : http;
      protocol.get(url, (blobRes) => {
        const totalSize = parseInt(blobRes.headers['content-length'], 10);
        res.writeHead(200, {
          'Content-Length': totalSize,
          'Content-Type': mimetype,
          'Accept-Ranges': 'bytes',
        });
        blobRes.pipe(res);
      }).on('error', (err) => {
        console.error('[Stream Full] Error:', err.message);
        res.status(500).end();
      });
    }
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findOneAndDelete({
      _id: req.params.id,
      uploadedBy: req.user._id
    });
    if (!video) return res.status(404).json({
      message: 'Not found or not authorized'
    });
    await deleteBlob(video.path);
    res.json({
      message: 'Video deleted'
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};