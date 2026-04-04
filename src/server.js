const express = require('express');
const cors = require('cors');
const http = require('http');
const {
    Server
} = require('socket.io');
const mongoose = require('mongoose');
const initSocketHandlers = require('./socket/socket.handler');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const authRouter = require('./routes/auth.routes')
const videoRouter = require('./routes/video.routes')
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN

// Allowed cors origin for domain
app.use(cors({
    origin: ALLOWED_ORIGIN,
    credentials: true
}));
app.use(express.json());

const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGIN,
        credentials: true,
    },
});

// Middleware to attach Socket.IO instance to each request
app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/api/auth', authRouter);
app.use('/api/videos', videoRouter);

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Initialize socket to connect with clients
initSocketHandlers(io);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});