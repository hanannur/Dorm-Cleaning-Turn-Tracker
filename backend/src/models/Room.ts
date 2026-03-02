import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
    name: string;
    code: string;
    ownerId: mongoose.Types.ObjectId;
    members: mongoose.Types.ObjectId[];
    status: 'Clean' | 'Pending' | 'Overdue';
}

const RoomSchema = new Schema<IRoom>(
    {
        name: { type: String, required: true, trim: true },
        code: { type: String, required: true, unique: true, uppercase: true },
        ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        members: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
        status: { type: String, enum: ['Clean', 'Pending', 'Overdue'], default: 'Pending' },
    },
    { timestamps: true }
);

export default mongoose.model<IRoom>('Room', RoomSchema);
