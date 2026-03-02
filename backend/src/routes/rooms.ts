import { Router, Response } from 'express';
import mongoose from 'mongoose';
import Room from '../models/Room';
import User from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { sendRoomInvite } from '../services/emailService';

const router = Router();

// All room routes require authentication
router.use(requireAuth);

// POST /api/rooms — create a new room
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    const user = req.user!;
    const { name } = req.body;
    if (!name) { res.status(400).json({ error: 'Room name is required' }); return; }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = await Room.create({
        name,
        code,
        ownerId: user._id,
        members: [user._id],   // creator is first member
    });

    await User.findByIdAndUpdate(user._id, { roomId: room._id });
    res.json({ id: room._id, name: room.name, code: room.code });
});

// POST /api/rooms/join — join by code
router.post('/join', async (req: AuthRequest, res: Response): Promise<void> => {
    const user = req.user!;
    const { code } = req.body;
    const room = await Room.findOne({ code: code?.toUpperCase() });
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }

    // Add user to members array if not already in it
    if (!room.members.map(m => m.toString()).includes(user._id.toString())) {
        room.members.push(user._id as mongoose.Types.ObjectId);
        await room.save();
    }

    await User.findByIdAndUpdate(user._id, { roomId: room._id });
    res.json({ id: room._id, name: room.name, code: room.code });
});

// POST /api/rooms/invite — send email invite with room code
router.post('/invite', async (req: AuthRequest, res: Response): Promise<void> => {
    const user = req.user!;
    if (!user.roomId) { res.status(400).json({ error: 'You are not in a room' }); return; }

    const { email } = req.body;
    if (!email) { res.status(400).json({ error: 'Email is required' }); return; }

    const room = await Room.findById(user.roomId);
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }

    try {
        await sendRoomInvite(email, user.name, room.name, room.code);
        res.json({ success: true, message: `Invite sent to ${email}` });
    } catch (err) {
        console.error('Email send failed:', err);
        res.status(500).json({ error: 'Failed to send invite email' });
    }
});

// GET /api/room/data — get current room + roommates
router.get('/data', async (req: AuthRequest, res: Response): Promise<void> => {
    const user = req.user!;
    if (!user.roomId) { res.status(404).json({ error: 'No room' }); return; }

    const room = await Room.findById(user.roomId);
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }

    const roommates = await User.find({ roomId: user.roomId }, 'name streak lastCleaned');
    res.json({
        room: {
            _id: room._id,
            name: room.name,
            code: room.code,
            ownerId: room.ownerId,
            status: room.status,
            members: room.members,
        },
        roommates: roommates.map(r => ({
            id: r._id,
            name: r.name,
            streak: r.streak,
            last_cleaned: r.lastCleaned,
        })),
    });
});

// POST /api/room/finish — mark clean, increment streak, rotate turn
router.post('/finish', async (req: AuthRequest, res: Response): Promise<void> => {
    const user = req.user!;
    if (!user.roomId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const room = await Room.findById(user.roomId);
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
    if (room.ownerId.toString() !== user._id.toString()) {
        res.status(403).json({ error: 'Not your turn' }); return;
    }

    await User.findByIdAndUpdate(user._id, {
        $inc: { streak: 1 },
        lastCleaned: new Date(),
    });

    await Room.findByIdAndUpdate(room._id, { status: 'Clean' });

    const roommates = await User.find({ roomId: user.roomId }, '_id').sort({ _id: 1 });
    const currentIndex = roommates.findIndex(r => r._id.toString() === user._id.toString());
    const nextOwner = roommates[(currentIndex + 1) % roommates.length]._id;
    await Room.findByIdAndUpdate(room._id, { ownerId: nextOwner });

    const io = req.app.get('io');
    io?.to(`room-${user.roomId}`).emit('roomUpdate');

    res.json({ success: true });
});

// POST /api/room/swap — pass turn to next roommate
router.post('/swap', async (req: AuthRequest, res: Response): Promise<void> => {
    const user = req.user!;
    if (!user.roomId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const room = await Room.findById(user.roomId);
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
    if (room.ownerId.toString() !== user._id.toString()) {
        res.status(403).json({ error: 'Not your turn' }); return;
    }

    const roommates = await User.find({ roomId: user.roomId }, '_id').sort({ _id: 1 });
    const currentIndex = roommates.findIndex(r => r._id.toString() === user._id.toString());
    const nextOwner = roommates[(currentIndex + 1) % roommates.length]._id;
    await Room.findByIdAndUpdate(room._id, { ownerId: nextOwner });

    const io = req.app.get('io');
    io?.to(`room-${user.roomId}`).emit('roomUpdate');

    res.json({ success: true });
});

export default router;
