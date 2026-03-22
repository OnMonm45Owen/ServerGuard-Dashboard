// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';

// 💡 เพิ่ม `user` เข้ามาในวงเล็บ Props
export default function Navbar({ darkMode, setDarkMode, onHomeClick, onSettingsClick, onLogout, isAdmin, user }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="bg-white/90 dark:bg-[#161D31]/95 backdrop-blur-md border-b-2 border-slate-300 dark:border-slate-700 sticky top-0 z-50 px-6 transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto h-20 flex justify-between items-center">

        {/* โลโก้ด้านซ้าย */}
        <div className="flex items-center gap-4 cursor-pointer group" onClick={onHomeClick}>
          <div className="w-12 h-12 bg-slate-900 dark:bg-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl shadow-xl group-hover:rotate-6 transition-transform border-2 border-slate-800 dark:border-indigo-400">
            🛡️
          </div>
          <div>
            <span className="font-black text-2xl text-slate-900 dark:text-white block leading-none tracking-tighter">
              ServerGuard <span className="text-blue-600 dark:text-indigo-400">Pro</span>
            </span>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">Monitoring System</span>
          </div>
        </div>

        {/* เมนูด้านขวา */}
        <div className="flex items-center gap-4">
          
          {/* 💡 แสดงสถานะผู้ใช้งาน (Admin หรือ Guest) */}
          {user && (
            <div className="hidden lg:flex flex-col items-end mr-2 border-r-2 border-slate-200 dark:border-slate-700 pr-4">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                Current Session
              </span>
              <span className={`text-xs font-black uppercase tracking-tighter ${isAdmin ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {isAdmin ? (user.email || 'Administrator') : 'Guest (View Only)'}
              </span>
            </div>
          )}

          {isAdmin && (
            <button
              onClick={onSettingsClick}
              className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
            >
              ⚙️ Settings
            </button>
          )}

          <div className="hidden sm:flex items-center gap-3 bg-slate-50 dark:bg-[#0f172a] px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse border border-emerald-400"></span>
            <span className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase tracking-widest">Live</span>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#1e293b] border-2 border-slate-300 dark:border-slate-600 shadow-md hover:scale-110 transition-all"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* ปุ่ม Logout */}
          <button
            onClick={onLogout}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-2 border-rose-200 dark:border-rose-800 hover:bg-rose-600 hover:text-white transition-all"
            title="Logout"
          >
            🚪
          </button>
        </div>
      </div>
    </nav>
  );
}