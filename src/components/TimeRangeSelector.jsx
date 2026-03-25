// src/components/TimeRangeSelector.jsx
import React from "react";

/**
 * Component สำหรับเลือกช่วงเวลาและวันที่เพื่อดูข้อมูลย้อนหลัง
 * ปรับปรุงให้มีความคมชัดสูง (High Contrast) และรองรับหน้าจอมือถือ (Responsive)
 */
export default function TimeRangeSelector({
  timeRange,
  setTimeRange,
  selectedDate,
  setSelectedDate
}) {
  const ranges = ["1h", "24h", "7d", "30d"];

  return (
    // 💡 ปรับเป็น flex-col บนมือถือ (เรียงบนลงล่าง) และ flex-row บนจอใหญ่
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
      
      {/* 📅 ส่วนเลือกวันที่ (Date Picker) */}
      <div className="flex flex-col gap-1 w-full sm:w-auto">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Analyze Date</span>
        <div className="relative group w-full sm:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="
              w-full sm:w-auto
              appearance-none 
              bg-white dark:bg-[#1e293b] 
              border-2 border-slate-900 dark:border-slate-700 
              text-slate-900 dark:text-white 
              px-5 py-2.5 rounded-2xl 
              text-sm font-black 
              focus:outline-none focus:border-indigo-600 dark:focus:border-indigo-400 
              transition-all cursor-pointer shadow-[0_4px_0_0_rgba(0,0,0,0.1)]
              group-hover:border-slate-500 dark:group-hover:border-slate-500
            "
          />
        </div>
      </div>

      {/* 🕒 ส่วนเลือกช่วงเวลา (Quick Range Select) */}
      <div className="flex flex-col gap-1 w-full sm:w-auto overflow-hidden">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Time Scope</span>
        
        {/* 💡 เพิ่ม overflow-x-auto และ w-full เพื่อให้มือถือสามารถใช้นิ้วปัดเลื่อนซ้ายขวาได้ */}
        <div className="flex bg-slate-200 dark:bg-[#0f172a] p-1.5 rounded-2xl border-2 border-slate-900 dark:border-slate-700 shadow-inner overflow-x-auto hide-scrollbar w-full sm:w-auto">
          {ranges.map((r) => {
            const isActive = r === timeRange;

            return (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`
                  shrink-0 /* 💡 ป้องกันไม่ให้ปุ่มโดนบีบจนเละบนจอมือถือ */
                  px-4 sm:px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-[0.15em] 
                  ${isActive
                    ? "bg-slate-900 text-white border-2 border-slate-900 shadow-lg scale-105 dark:bg-indigo-600 dark:border-indigo-400"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#1e293b]"
                  }
                `}
              >
                {r}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}