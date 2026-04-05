const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('ffprobe-static');

ffmpeg.setFfprobePath(ffprobe.path);

// Video Meta Data retrieve function
const getVideoMetadata = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);

            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
            
            resolve({
                duration: Math.round(metadata.format.duration || 0), // seconds
                size: metadata.format.size,
                bitrate: metadata.format.bit_rate,
                videoCodec: videoStream?.codec_name,
                audioCodec: audioStream?.codec_name,
                fps: videoStream?.r_frame_rate,
            });
        });
    });
};

const validateVideo = (filePath) => {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return resolve(false);
            const hasVideo = metadata.streams.some(s => s.codec_type === 'video');
            resolve(hasVideo);
        });
    });
};


module.exports = {
    getVideoMetadata,
    validateVideo
};