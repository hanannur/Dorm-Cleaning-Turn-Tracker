import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

const db = new Database("dormmate.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    room_id INTEGER,
    streak INTEGER DEFAULT 0,
    last_cleaned TEXT
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    code TEXT UNIQUE,
    owner_id INTEGER,
    status TEXT DEFAULT 'Pending' -- 'Clean', 'Pending', 'Overdue'
  );
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Helper to get user from session (simplified for demo)
  const getUser = (req: any) => {
    const userId = req.cookies.userId;
    if (!userId) return null;
    return db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  };

  // Auth Routes
  app.post("/api/register", (req, res) => {
    const { email, password, name } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      const result = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)").run(email, hashedPassword, name);
      res.cookie("userId", result.lastInsertRowid, { httpOnly: true, sameSite: 'none', secure: true });
      res.json({ id: result.lastInsertRowid, email, name });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (user && bcrypt.compareSync(password, user.password)) {
      res.cookie("userId", user.id, { httpOnly: true, sameSite: 'none', secure: true });
      res.json({ id: user.id, email: user.email, name: user.name, room_id: user.room_id });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/logout", (req, res) => {
    res.clearCookie("userId");
    res.json({ success: true });
  });

  app.get("/api/me", (req, res) => {
    const user = getUser(req);
    if (user) res.json(user);
    else res.status(401).json({ error: "Not logged in" });
  });

  // Room Routes
  app.post("/api/rooms", (req, res) => {
    const user: any = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { name } = req.body;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = db.prepare("INSERT INTO rooms (name, code, owner_id) VALUES (?, ?, ?)").run(name, code, user.id);
    db.prepare("UPDATE users SET room_id = ? WHERE id = ?").run(result.lastInsertRowid, user.id);
    res.json({ id: result.lastInsertRowid, name, code });
  });

  app.post("/api/rooms/join", (req, res) => {
    const user: any = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { code } = req.body;
    const room: any = db.prepare("SELECT * FROM rooms WHERE code = ?").get(code);
    if (!room) return res.status(404).json({ error: "Room not found" });
    db.prepare("UPDATE users SET room_id = ? WHERE id = ?").run(room.id, user.id);
    res.json(room);
  });

  app.get("/api/room/data", (req, res) => {
    const user: any = getUser(req);
    if (!user || !user.room_id) return res.status(404).json({ error: "No room" });
    const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(user.room_id);
    const roommates = db.prepare("SELECT id, name, streak, last_cleaned FROM users WHERE room_id = ?").all(user.room_id);
    res.json({ room, roommates });
  });

  app.post("/api/room/finish", (req, res) => {
    const user: any = getUser(req);
    if (!user || !user.room_id) return res.status(401).json({ error: "Unauthorized" });
    
    const room: any = db.prepare("SELECT * FROM rooms WHERE id = ?").get(user.room_id);
    if (room.owner_id !== user.id) return res.status(403).json({ error: "Not your turn" });

    db.prepare("UPDATE users SET streak = streak + 1, last_cleaned = ? WHERE id = ?").run(new Date().toISOString(), user.id);
    db.prepare("UPDATE rooms SET status = 'Clean' WHERE id = ?").run(user.room_id);
    
    // Rotate owner (simplified: pick next user in list)
    const roommates: any[] = db.prepare("SELECT id FROM users WHERE room_id = ? ORDER BY id ASC").all(user.room_id);
    const currentIndex = roommates.findIndex(r => r.id === user.id);
    const nextOwner = roommates[(currentIndex + 1) % roommates.length].id;
    db.prepare("UPDATE rooms SET owner_id = ? WHERE id = ?").run(nextOwner, user.id);

    io.to(`room-${user.room_id}`).emit("roomUpdate");
    res.json({ success: true });
  });

  app.post("/api/room/swap", (req, res) => {
    const user: any = getUser(req);
    if (!user || !user.room_id) return res.status(401).json({ error: "Unauthorized" });
    
    const room: any = db.prepare("SELECT * FROM rooms WHERE id = ?").get(user.room_id);
    if (room.owner_id !== user.id) return res.status(403).json({ error: "Not your turn" });

    const roommates: any[] = db.prepare("SELECT id FROM users WHERE room_id = ? ORDER BY id ASC").all(user.room_id);
    const currentIndex = roommates.findIndex(r => r.id === user.id);
    const nextOwner = roommates[(currentIndex + 1) % roommates.length].id;
    db.prepare("UPDATE rooms SET owner_id = ? WHERE id = ?").run(nextOwner, user.room_id);

    io.to(`room-${user.room_id}`).emit("roomUpdate");
    res.json({ success: true });
  });

  // Socket.io
  io.on("connection", (socket) => {
    socket.on("joinRoom", (roomId) => {
      socket.join(`room-${roomId}`);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
