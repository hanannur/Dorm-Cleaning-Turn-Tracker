import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User';

// Extend Express Request to carry the authenticated user
export interface AuthRequest extends Request {
    user?: IUser;
}

export const requireAuth = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const userId = req.cookies?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Not logged in' });
            return;
        }

        const user = await User.findById(userId);
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }

        req.user = user;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid session' });
    }
};
