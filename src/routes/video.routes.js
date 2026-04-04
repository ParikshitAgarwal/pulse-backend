const {
    Router
} = require('express')
const router = Router();
const upload = require('../middleware/upload.middleware');
const {
    protect,
    authorize
} = require('../middleware/auth.middleware');
const videoController = require('../controllers/video.controller');

// Add this middleware before routes
router.use((req, res, next) => {
    // Allow token from query param for video streaming
    if (req.query.token && !req.headers.authorization) {
        req.headers.authorization = `Bearer ${req.query.token}`;
    }
    next();
});
router.use(protect);

router.get('/', videoController.getVideos);
router.get('/:id', videoController.getVideoById);
router.get('/:id/stream', videoController.streamVideo);
router.post('/', authorize('editor', 'admin'), upload.single('video'), videoController.uploadVideo);
router.delete('/:id', authorize('editor', 'admin'), videoController.deleteVideo);

module.exports = router;