import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGO_URI is not defined in .env');
    }

    try {
        await mongoose.connect(uri);
        console.log('✅  MongoDB connected successfully');
    } catch (error) {
        console.error('❌  MongoDB connection failed:', error);
        process.exit(1);
    }
};

export default connectDB;
