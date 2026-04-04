module.exports = function initSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Client joins a room to track specific video progress
    socket.on('watch_video', (videoId) => {
      socket.join(`video_${videoId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};