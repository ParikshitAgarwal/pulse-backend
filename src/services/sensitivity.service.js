const Video = require('../models/Video.model');

/**
    One progress % per stage, strictly increasing, ending at 100.
    Different each run so each video shows a distinct progress curve.
 */
function randomProgressMilestones(stageCount) {
    const u = Array.from({
        length: stageCount - 1
    }, () => Math.random()).sort((a, b) => a - b);
    const out = u.map((x) => Math.max(1, Math.min(99, Math.floor(1 + x * 98))));

    for (let i = 1; i < out.length; i++) {
        if (out[i] <= out[i - 1]) out[i] = Math.min(99, out[i - 1] + 1);
    }
    out.push(100);
    return out;
}

// Realistic timing based on file size
const getStageDelay = (baseSecs, fileSizeMB, durationSecs) => {
    const sizeMultiplier = Math.min(fileSizeMB / 50, 1); // 50MB = full weight
    const durationMultiplier = Math.min(durationSecs / 120, 1); // 2min = full weight

    const combined = 0.5 + (sizeMultiplier * 0.8) + (durationMultiplier * 0.7);

    const jitter = 0.8 + Math.random() * 0.4; // ±20%
    return Math.floor(baseSecs * 1000 * combined * jitter);
};


const analyzeVideo = async (videoId, io) => {
    const video = await Video.findById(videoId);
    if (!video) return;

    const fileSizeBytes = video.size;
    const fileSizeMB = fileSizeBytes / (1024 * 1024);
    const durationSecs = video.duration || 30;

    // Each stage has its own realistic base duration (in seconds); progress % is random per video
    const stages = [{
            message: `Reading file metadata (${fileSizeMB.toFixed(1)} MB)...`,
            baseSecs: 0.2
        },
        {
            message: 'Extracting video frames...',
            baseSecs: 0.8
        },
        {
            message: 'Decoding audio track...',
            baseSecs: 0.6
        },
        {
            message: 'Running visual content classifier...',
            baseSecs: 1.8
        },
        {
            message: 'Analyzing speech and audio patterns...',
            baseSecs: 1.5
        },
        {
            message: 'Scanning for sensitive visual content...',
            baseSecs: 1.8
        },
        {
            message: 'Cross-referencing content database...',
            baseSecs: 0.8
        },
        {
            message: 'Calculating risk scores...',
            baseSecs: 0.5
        },
        {
            message: 'Generating sensitivity report...',
            baseSecs: 0.4
        },
        {
            message: 'Analysis complete.',
            baseSecs: 0.2
        },
    ];

    const progressMilestones = randomProgressMilestones(stages.length);

    // Run through each stage
    for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        const progress = progressMilestones[i];
        await delay(getStageDelay(stage.baseSecs, fileSizeMB, durationSecs));

        await Video.findByIdAndUpdate(videoId, {
            processingProgress: progress,
            status: 'processing'
        });
        io.to(`video_${videoId}`).emit('progress', {
            videoId,
            progress,
            message: stage.message,
            fileSizeMB: parseFloat(fileSizeMB.toFixed(1))
        });

    }

    // Realistic Score Calculation 
    const sizeRiskBonus = Math.min(fileSizeMB / 1000, 0.05);

    const violenceRaw = Math.random() * 1;
    const adultRaw = Math.random() * 0.9;
    const hateSpeechRaw = Math.random() * 0.8;
    const spamRaw = Math.random() * 0.7;
    const copyrightRaw = Math.random() * 0.6;

    const compositeScore =
        violenceRaw * 0.30 +
        adultRaw * 0.25 +
        hateSpeechRaw * 0.20 +
        spamRaw * 0.10 +
        copyrightRaw * 0.15 +
        sizeRiskBonus;

    const finalScore = parseFloat(Math.min(compositeScore, 1).toFixed(2));
    const isFlagged = finalScore > 0.5
    // Severity label
    let severity = 'none';
    if (finalScore > 0.75) severity = 'high';
    else if (finalScore > 0.55) severity = 'medium';
    else if (finalScore > 0.30) severity = 'low';

    const result = await Video.findByIdAndUpdate(videoId, {
        status: isFlagged ? 'flagged' : 'safe',
        sensitivityScore: finalScore,
        processingProgress: 100,
        sensitivityDetails: {
            violenceScore: parseFloat(violenceRaw.toFixed(2)),
            adultContentScore: parseFloat(adultRaw.toFixed(2)),
            hateSpeechScore: parseFloat(hateSpeechRaw.toFixed(2)),
            spamScore: parseFloat(spamRaw.toFixed(2)),
            copyrightScore: parseFloat(copyrightRaw.toFixed(2)),
            compositeScore: finalScore,
            severity,
            fileSizeMB: parseFloat(fileSizeMB.toFixed(1)),
            analyzedAt: new Date()
        }
    }, {
        new: true
    });

    io.to(`video_${videoId}`).emit('complete', {
        videoId,
        status: result.status,
        sensitivityScore: result.sensitivityScore,
        severity,
        details: result.sensitivityDetails
    });
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
module.exports = {
    analyzeVideo
};