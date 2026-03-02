import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/register
router.post('/register', async (req, res: Response): Promise<void> => {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
        res.status(400).json({ error: 'All fields are required' });
        return;
    }
    try {
        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({ email, password: hashed, name });
        res.cookie('userId', user._id.toString(), { httpOnly: true, sameSite: 'none', secure: true });
        res.json({ id: user._id, email: user.email, name: user.name });
    } catch {
        res.status(400).json({ error: 'Email already exists' });
    }
});

// POST /api/login
router.post('/login', async (req, res: Response): Promise<void> => {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
    }
    res.cookie('userId', user._id.toString(), { httpOnly: true, sameSite: 'none', secure: true });
    res.json({ id: user._id, email: user.email, name: user.name, roomId: user.roomId });
});

// POST /api/logout
router.post('/logout', (_req, res: Response): void => {
    res.clearCookie('userId');
    res.json({ success: true });
});

// GET /api/me
router.get('/me', requireAuth, (req: AuthRequest, res: Response): void => {
    const user = req.user!;
    res.json({ id: user._id, email: user.email, name: user.name, roomId: user.roomId });
});

export default router;
