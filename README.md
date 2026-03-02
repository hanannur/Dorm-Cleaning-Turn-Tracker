# 🏠 Dorm-Cleaning Turn Tracker

> Shared living, simplified. A real-time cleaning schedule app for roommates.

---

## What It Does

Dorm-Cleaning Turn Tracker helps roommates coordinate who cleans the dorm and when. It fairly rotates cleaning duties, tracks streaks, and sends email invitations — all in real time.

**Key features:**
- 🔐 Register / Login with secure hashed passwords
- 🏠 Create a room or join one with a code
- 📧 Invite roommates by email
- 🔄 Rotating cleaning turns — auto-assigned to the next roommate after each clean
- 🏆 Cleaning streaks leaderboard
- ⚡ Real-time updates via Socket.IO (everyone sees changes instantly)

---

## Project Structure

```
cleaning-dorm/
├── frontend/        # React + Vite + TypeScript (UI)
└── backend/         # Express + TypeScript + MongoDB (API)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB (Mongoose) |
| Realtime | Socket.IO |
| Auth | Cookie-based sessions, bcryptjs |
| Email | Nodemailer (Gmail SMTP) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) **or** a MongoDB Atlas cluster

---

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:

```env
MONGO_URI=mongodb://localhost:27017/dormmate
PORT=5000

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

> For Gmail, use an [App Password](https://myaccount.google.com/apppasswords) — not your real password.

Start the backend:

```bash
npm run dev
```

Server runs on **http://localhost:5000**

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs on **http://localhost:3000**

---

## API Reference

### Auth

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/register` | Create a new account |
| `POST` | `/api/login` | Login and receive session cookie |
| `POST` | `/api/logout` | Clear session |
| `GET` | `/api/me` | Get current logged-in user |

### Rooms

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/rooms` | Create a new room |
| `POST` | `/api/rooms/join` | Join a room by code |
| `POST` | `/api/rooms/invite` | Send email invite with room code |
| `GET` | `/api/room/data` | Get room info + all roommates |
| `POST` | `/api/room/finish` | Mark room as cleaned, rotate turn |
| `POST` | `/api/room/swap` | Pass your turn to the next person |

> All room routes require an active session (login first). Auth is handled via `userId` cookie.

---

## How the Cleaning Rotation Works

1. The person who **creates** the room goes first.
2. When they click **"Finished"** → room is marked `Clean`, their streak increases by 1, and the turn passes to the next roommate.
3. If they click **"Can't Today"** → turn passes without marking it clean (no streak increase).
4. Rotation is circular — after the last roommate, it goes back to the first.

---

## Environment Variables

### Backend `.env`

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `PORT` | Port for the backend server (default: 5000) |
| `EMAIL_HOST` | SMTP host (e.g. `smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (e.g. `587`) |
| `EMAIL_USER` | Sender email address |
| `EMAIL_PASS` | Email app password |

---

## License

MIT
