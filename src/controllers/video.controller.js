const Video = require('../models/Video.model');
const {
  validateVideo,
  getVideoMetadata
} = require('../services/ffmpeg.service');
const {
  analyzeVideo
} = require('../services/sensitivity.service');
const fs = require('fs');
const path = require('path');

exports.uploadVideo = async (req, res) => {
  try {
    const {
      title
    } = req.body;
    const file = req.file;


    const isValid = await validateVideo(file.path);
    if (!isValid) {
      fs.unlinkSync(file.path); // delete the fake file
      return res.status(400).json({
        message: 'Invalid video file — could not read video stream'
      });
    }

    const meta = await getVideoMetadata(file.path);

    const video = await Video.create({
      title: title || file.originalname,
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
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

    const videoPath = path.resolve(video.path);
    const fileSize = video.size;
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      if (start >= fileSize || end >= fileSize) {
        return res.status(416).send('Requested range not satisfiable');
      }
      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(videoPath, {
        start,
        end
      });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': video.mimetype
      });
      fileStream.on('error', () => res.sendStatus(404));
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': video.mimetype
      });
      fs.createReadStream(videoPath).pipe(res);
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
    await fs.promises.unlink(path.resolve(video.path));
    res.json({
      message: 'Video deleted'
    });
  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};