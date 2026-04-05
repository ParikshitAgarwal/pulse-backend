const ffmpeg = require('fluent-ffmpeg');
const ffprobe = require('ffprobe-static');
const {
    Readable
} = require('stream');

ffmpeg.setFfprobePath(ffprobe.path);

// Video Meta Data retrieve function
const getVideoMetadata = (buffer) => {
    return new Promise((resolve, reject) => {

        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);

        ffmpeg(readable).ffprobe((err, metadata) => {
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

const validateVideo = (buffer) => {
    return new Promise((resolve) => {
        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);
        ffmpeg(readable).ffprobe((err, metadata) => {
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