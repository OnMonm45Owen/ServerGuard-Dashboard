import React from "react";

/**
 * Component สำหรับเลือกช่วงเวลาและวันที่เพื่อดูข้อมูลย้อนหลัง
 * ปรับปรุงให้มีความคมชัดสูง (High Contrast) และเส้นขอบหนาชัดเจน
 */
export default function TimeRangeSelector({
  timeRange,
  setTimeRange,
  selectedDate,
  setSelectedDate
}) {
  const ranges = ["24h", "7d", "30d"];

  return (
    <div className="flex flex-wrap gap-4 items-center">
      
      {/* 📅 ส่วนเลือกวันที่ (Date Picker) - เน้นขอบหนาและตัวเลขชัดเจน */}
      <div className="relative group">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="
            appearance-none 
            bg-white dark:bg-[#1e293b] 
            /* 💡 เส้นขอบหนา 2px และใช้สีที่ตัดกันชัดเจน */
            border-2 border-slate-300 dark:border-slate-700 
            text-slate-900 dark:text-white 
            px-5 py-2.5 rounded-2xl 
            text-sm font-black 
            focus:outline-none focus:border-blue-600 dark:focus:border-indigo-400 
            transition-all cursor-pointer shadow-md
            group-hover:border-slate-400 dark:group-hover:border-slate-500
          "
        />
        {/* หมายเหตุ: ไอคอนปฏิทินจะถูกจัดการผ่าน CSS Filter ที่เราใส่ไว้ใน index.css */}
      </div>

      {/* 🕒 ส่วนเลือกช่วงเวลา (Quick Range Select) - แยกปุ่มออกจากกันด้วยกรอบหนา */}
      <div className="flex bg-slate-100 dark:bg-[#0f172a] p-1.5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-inner">
        {ranges.map((r) => {
          const isActive = r === timeRange;

          return (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`
                px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 uppercase tracking-[0.15em] 
                ${isActive
                  ? "bg-slate-900 text-white border-2 border-slate-900 shadow-xl scale-105 dark:bg-indigo-600 dark:border-indigo-400"
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
  );
}