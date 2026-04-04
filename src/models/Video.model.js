const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organisation: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'safe', 'flagged', 'error'],
    default: 'uploading'
  },
  videoCodec: {
    type: String,
    default: ''
  },
  audioCodec: {
    type: String,
    default: ''
  },
  bitrate: {
    type: String,
    default: ''
  },
  sensitivityScore: {
    type: Number,
    default: 0
  },
  sensitivityDetails: {
    type: Object,
    default: {}
  },
  processingProgress: {
    type: Number,
    default: 0
  }, // 0-100
  path: {
    type: String,
    required: true
  },
  accessRoles: [{
    type: String,
    enum: ['viewer', 'editor', 'admin']
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Video', videoSchema);