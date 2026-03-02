import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // true for port 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendRoomInvite = async (
    toEmail: string,
    inviterName: string,
    roomName: string,
    roomCode: string
): Promise<void> => {
    const mailOptions = {
        from: `"Dorm-Mate 🏠" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `${inviterName} invited you to join their dorm room on Dorm-Mate!`,
        html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #fafaf9; border-radius: 16px; border: 1px solid #e7e5e4;">
        <h1 style="font-size: 24px; font-weight: 700; color: #1c1917; margin-bottom: 4px;">You're invited! 🏠</h1>
        <p style="color: #78716c; margin-bottom: 24px;">
          <strong>${inviterName}</strong> has invited you to join <strong>${roomName}</strong> on Dorm-Mate — a shared cleaning schedule app for roommates.
        </p>

        <div style="background: #1c1917; color: #fafaf9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.6; margin: 0 0 8px;">Your Room Code</p>
          <p style="font-size: 36px; font-weight: 700; font-family: monospace; letter-spacing: 0.15em; margin: 0;">${roomCode}</p>
        </div>

        <p style="color: #78716c; font-size: 14px;">
          👉 Go to the app, click <strong>"Join a Room"</strong>, and enter the code above.
        </p>

        <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;" />
        <p style="font-size: 12px; color: #a8a29e;">Dorm-Mate · Shared living, simplified.</p>
      </div>
    `,
    };

    await transporter.sendMail(mailOptions);
};
