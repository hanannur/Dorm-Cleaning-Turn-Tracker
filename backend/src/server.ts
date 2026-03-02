import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import connectDB from './config/db';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: 'http://localhost:3000',
        credentials: true,
    },
});

const PORT = process.env.PORT || 5000;

// Make io accessible inside route handlers via req.app.get('io')
app.set('io', io);

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/room', roomRoutes);

// Socket.IO — let clients subscribe to their room channel
io.on('connection', (socket) => {
    socket.on('joinRoom', (roomId: string) => {
        socket.join(`room-${roomId}`);
    });
});

// Start server after DB is connected
connectDB().then(() => {
    httpServer.listen(PORT, () => {
        console.log(`🚀  Server running on http://localhost:${PORT}`);
    });
});
