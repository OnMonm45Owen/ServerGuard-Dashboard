import React, { useState, useEffect } from 'react';

export default function Navbar({ darkMode, setDarkMode, onHomeClick }) {
  const [time, setTime] = useState(new Date());

  // ทำให้เวลาเดินทุกๆ 1 วินาที
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="bg-white/70 dark:bg-[#283046]/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700/50 sticky top-0 z-50 px-6">
      <div className="max-w-7xl mx-auto h-20 flex justify-between items-center">

        <div className="flex items-center gap-4 cursor-pointer group" onClick={onHomeClick}>
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:rotate-6 transition-transform">
            🛡️
          </div>
          <div>
            <span className="font-black text-2xl text-slate-800 dark:text-white block leading-none">
              ServerGuard <span className="text-blue-500 dark:text-indigo-400">Pro</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Monitoring System</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* 💡 แสดงเวลาปัจจุบันแบบ Digital Box */}
          <div className="hidden md:block text-right">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase block mb-1">Current Time</span>
            <span className="text-lg font-mono font-bold text-blue-600 dark:text-indigo-400 bg-blue-50 dark:bg-indigo-500/10 px-4 py-1.5 rounded-xl border border-blue-100 dark:border-indigo-500/20">
              {time.toLocaleTimeString('th-TH')}
            </span>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#161D31] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
            <span className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
              Live System
            </span>
          </div>

          {/* ปุ่มสลับโหมด ถ้าคุณมีฟังก์ชัน setDarkMode ส่งมาด้วย */}
          <button
            onClick={() => setDarkMode(!darkMode)} // 💡 ตรวจสอบว่ามีบรรทัดนี้ในปุ่มสลับโหมด
            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-[#161D31] text-slate-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

      </div>
    </nav>
  );
}