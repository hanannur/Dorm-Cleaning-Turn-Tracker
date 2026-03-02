import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LogOut,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trophy,
  ArrowRightLeft,
  Copy,
  Check
} from 'lucide-react';
import { io } from 'socket.io-client';
import { User, RoomData } from './types';

const socket = io();

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'auth' | 'setup' | 'dashboard'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '', roomName: '', roomCode: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user?.room_id) {
      fetchRoomData();
      socket.emit('joinRoom', user.room_id);
      socket.on('roomUpdate', fetchRoomData);
      return () => {
        socket.off('roomUpdate');
      };
    }
  }, [user?.room_id]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        if (data.room_id) setView('dashboard');
        else setView('setup');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoomData = async () => {
    try {
      const res = await fetch('/api/room/data');
      if (res.ok) {
        const data = await res.json();
        setRoomData(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? '/api/login' : '/api/register';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data);
      if (data.room_id) setView('dashboard');
      else setView('setup');
    } else {
      alert('Auth failed');
    }
  };

  const handleCreateRoom = async () => {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formData.roomName }),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(prev => prev ? { ...prev, room_id: data.id } : null);
      setView('dashboard');
    }
  };

  const handleJoinRoom = async () => {
    const res = await fetch('/api/rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: formData.roomCode }),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(prev => prev ? { ...prev, room_id: data.id } : null);
      setView('dashboard');
    }
  };

  const handleFinish = async () => {
    await fetch('/api/room/finish', { method: 'POST' });
  };

  const handleSwap = async () => {
    await fetch('/api/room/swap', { method: 'POST' });
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
    setRoomData(null);
    setView('auth');
  };

  const copyCode = () => {
    if (roomData?.room.code) {
      navigator.clipboard.writeText(roomData.room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="animate-pulse text-stone-400 font-mono">DORM_MATE_LOADING...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-200">
      <AnimatePresence mode="wait">
        {view === 'auth' && (
          <motion.div
            key="auth"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto px-6 pt-20"
          >
            <div className="mb-12 text-center">
              <h1 className="text-4xl font-bold tracking-tight mb-2">Dorm-Cleaning</h1>
              <p className="text-stone-500 italic serif">Shared living, simplified.</p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                  placeholder="name@university.edu"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-all"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-stone-900 text-stone-50 py-4 rounded-xl font-bold hover:bg-stone-800 transition-colors"
              >
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="text-stone-500 text-sm hover:underline"
              >
                {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
              </button>
            </div>
          </motion.div>
        )}

        {view === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto px-6 pt-20"
          >
            <h2 className="text-3xl font-bold mb-8">Welcome, {user?.name}</h2>

            <div className="space-y-8">
              <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Create a Room
                </h3>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 mb-4"
                  placeholder="e.g. Unit 402"
                  value={formData.roomName}
                  onChange={e => setFormData({ ...formData, roomName: e.target.value })}
                />
                <button
                  onClick={handleCreateRoom}
                  className="w-full bg-stone-900 text-stone-50 py-3 rounded-xl font-bold"
                >
                  Create Room
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-stone-200"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-stone-50 px-2 text-stone-400 font-bold tracking-widest">or</span></div>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" /> Join a Room
                </h3>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 mb-4 uppercase"
                  placeholder="Enter Room Code"
                  value={formData.roomCode}
                  onChange={e => setFormData({ ...formData, roomCode: e.target.value.toUpperCase() })}
                />
                <button
                  onClick={handleJoinRoom}
                  className="w-full border-2 border-stone-900 text-stone-900 py-3 rounded-xl font-bold"
                >
                  Join Room
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'dashboard' && roomData && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-20"
          >
            {/* Header */}
            <header className="sticky top-0 z-10 bg-stone-50/80 backdrop-blur-md border-bottom border-stone-200 px-6 py-4 flex justify-between items-center">
              <div>
                <h1 className="font-bold text-xl">{roomData.room.name}</h1>
                <button
                  onClick={copyCode}
                  className="text-xs font-mono text-stone-400 flex items-center gap-1 hover:text-stone-600 transition-colors"
                >
                  Code: {roomData.room.code} {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <button onClick={handleLogout} className="p-2 text-stone-400 hover:text-stone-900 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </header>

            <main className="px-6 pt-6 space-y-6">
              {/* Notification Banner */}
              {roomData.room.owner_id === user?.id && roomData.room.status !== 'Clean' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="bg-stone-900 text-stone-50 p-4 rounded-2xl flex items-start gap-3 shadow-xl shadow-stone-900/20"
                >
                  <AlertCircle className="w-5 h-5 mt-0.5 text-amber-400 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">It's your turn to clean!</p>
                    <p className="text-xs text-stone-400 mt-1">A clean room is a happy room. Tap "Finished" when you're done.</p>
                  </div>
                </motion.div>
              )}

              {/* Status Card */}
              <div className={`p-8 rounded-3xl border-2 transition-all ${roomData.room.status === 'Clean' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                  roomData.room.status === 'Overdue' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                    'bg-amber-50 border-amber-200 text-amber-900'
                }`}>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest opacity-60">Room Status</span>
                    <h2 className="text-3xl font-bold mt-1">{roomData.room.status}</h2>
                  </div>
                  {roomData.room.status === 'Clean' ? <CheckCircle2 className="w-10 h-10" /> :
                    roomData.room.status === 'Overdue' ? <AlertCircle className="w-10 h-10" /> : <Clock className="w-10 h-10" />}
                </div>

                <div className="pt-6 border-t border-current/10">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-60">Today's Turn</span>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-full bg-current/10 flex items-center justify-center font-bold">
                      {roomData.roommates.find(r => r.id === roomData.room.owner_id)?.name[0]}
                    </div>
                    <span className="text-xl font-bold">
                      {roomData.room.owner_id === user?.id ? 'Your Turn' : roomData.roommates.find(r => r.id === roomData.room.owner_id)?.name}
                    </span>
                  </div>
                </div>

                {roomData.room.owner_id === user?.id && roomData.room.status !== 'Clean' && (
                  <div className="mt-8 grid grid-cols-2 gap-3">
                    <button
                      onClick={handleFinish}
                      className="bg-stone-900 text-stone-50 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-stone-900/20"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Finished
                    </button>
                    <button
                      onClick={handleSwap}
                      className="bg-white text-stone-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 border border-stone-200"
                    >
                      <ArrowRightLeft className="w-5 h-5" /> Can't Today
                    </button>
                  </div>
                )}
              </div>

              {/* Streaks */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4 px-2">Roommate Streaks</h3>
                <div className="space-y-3">
                  {roomData.roommates.map((mate) => (
                    <div key={mate.id} className="bg-white p-4 rounded-2xl border border-stone-200 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-xs font-bold">
                          {mate.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{mate.name} {mate.id === user?.id && '(You)'}</p>
                          <p className="text-[10px] text-stone-400 uppercase font-bold tracking-tighter">
                            {mate.last_cleaned ? `Last: ${new Date(mate.last_cleaned).toLocaleDateString()}` : 'Never cleaned'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1.5 rounded-full border border-stone-100">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-mono font-bold text-sm">{mate.streak}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
