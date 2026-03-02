import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
    email: string;
    password: string;
    name: string;
    roomId?: mongoose.Types.ObjectId;
    streak: number;
    lastCleaned?: Date;
}

const UserSchema = new Schema<IUser>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        name: { type: String, required: true, trim: true },
        roomId: { type: Schema.Types.ObjectId, ref: 'Room', default: null },
        streak: { type: Number, default: 0 },
        lastCleaned: { type: Date, default: null },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
