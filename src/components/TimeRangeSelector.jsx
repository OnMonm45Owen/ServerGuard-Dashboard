import React from "react";

/**
 * Component สำหรับเลือกช่วงเวลาและวันที่เพื่อดูข้อมูลย้อนหลัง
 * @param {string} timeRange - ช่วงเวลาปัจจุบัน (24h, 7d, 30d)
 * @param {function} setTimeRange - ฟังก์ชันสำหรับเปลี่ยนช่วงเวลา
 * @param {string} selectedDate - วันที่ที่เลือก (YYYY-MM-DD)
 * @param {function} setSelectedDate - ฟังก์ชันสำหรับเปลี่ยนวันที่
 */
export default function TimeRangeSelector({ 
  timeRange, 
  setTimeRange, 
  selectedDate, 
  setSelectedDate 
}) {
  
  const ranges = ["24h", "7d", "30d"];

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* 📅 ส่วนเลือกวันที่ (Date Picker) */}
      <div className="relative">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="appearance-none bg-white dark:bg-[#283046] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-[#D0D2D6] px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer shadow-sm"
        />
      </div>

      {/* 🕒 ส่วนเลือกช่วงเวลา (Quick Range Select) */}
      <div className="flex bg-white dark:bg-[#283046] p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {ranges.map((r) => {
          const isActive = r === timeRange;
          
          return (
            <button
              key={r}
              // 💡 จุดสำคัญ: เรียกใช้ setTimeRange เพื่ออัปเดต state ใน App.jsx และ trigger useSensorData
              onClick={() => setTimeRange(r)}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 uppercase tracking-wider ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105"
                  : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-[#D0D2D6] hover:bg-slate-50 dark:hover:bg-[#161D31]"
              }`}
            >
              {r}
            </button>
          );
        })}
      </div>
    </div>
  );
}