// src/components/Navbar.jsx
import React, { useState, useEffect } from 'react';

export default function Navbar({ darkMode, setDarkMode, onHomeClick }) {
  const [time, setTime] = useState(new Date());

  // ทำให้เวลาเดินทุกๆ 1 วินาที
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav className="bg-white/90 dark:bg-[#161D31]/95 backdrop-blur-md border-b-2 border-slate-300 dark:border-slate-700 sticky top-0 z-50 px-6 transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto h-20 flex justify-between items-center">

        {/* Logo Section - ปรับให้คมชัดและมีมิติ */}
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

        {/* Right Section: Time, Status, DarkMode */}
        <div className="flex items-center gap-6">
          
          {/* Digital Time Box - เน้นขอบหนาและตัวเลข mono ที่ชัดเจน */}
          <div className="hidden md:block text-right">
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase block mb-1 tracking-widest">Current Time</span>
            <span className="text-xl font-mono font-black text-slate-900 dark:text-indigo-400 bg-white dark:bg-[#0f172a] px-4 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-700 shadow-inner">
              {time.toLocaleTimeString('en-GB', { hour12: false })}
            </span>
          </div>
          
          {/* System Status Indicator - ปรับกรอบให้หนาขึ้น */}
          <div className="hidden sm:flex items-center gap-3 bg-slate-50 dark:bg-[#0f172a] px-4 py-2.5 rounded-xl border-2 border-slate-300 dark:border-slate-700">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)] border border-emerald-400"></span>
            <span className="text-xs font-black text-slate-900 dark:text-slate-200 uppercase tracking-widest">
              Live System
            </span>
          </div>

          {/* Theme Toggle Button - ปรับเป็นขอบหนา Border-2 */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-12 h-12 flex items-center justify-center rounded-xl bg-white dark:bg-[#1e293b] text-xl shadow-md border-2 border-slate-300 dark:border-slate-600 hover:border-slate-900 dark:hover:border-white hover:scale-110 active:scale-95 transition-all duration-200"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

      </div>
    </nav>
  );
}