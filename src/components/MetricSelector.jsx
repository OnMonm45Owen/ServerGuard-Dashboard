// src/components/MetricSelector.jsx
import React from "react";

// 💡 รับ metricsConfig เพิ่มเข้ามาจาก Props (ที่ส่งมาจาก useSensorData)
export default function MetricSelector({ activeMetric, onMetricChange, metricsConfig = {} }) {
  
  // 🔍 กรองรายการที่จะนำมาสร้างปุ่ม (ตัวอย่าง: ไม่แสดง 'ping' หรือ 'sound_peak' ในแถบเลือก)
  // หรือแสดงทั้งหมดตามที่อยู่ใน Database
  const metricKeys = Object.keys(metricsConfig).filter(key => key !== 'ping' && key !== 'sound_peak');

  return (
    <div className="flex gap-4 mt-6 flex-wrap justify-center">
      {metricKeys.map((metricKey) => {
        const config = metricsConfig[metricKey];
        const isActive = metricKey === activeMetric;

        return (
          <button
            key={metricKey}
            onClick={() => onMetricChange(metricKey)} 
            className={`
              /* 💡 เส้นขอบหนา 2px และ Transition พื้นฐาน */
              px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 border-2 
              
              ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900 scale-110 shadow-xl z-10 dark:bg-indigo-600 dark:border-indigo-400"
                  : "bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md"
              }
            `}
          >
            <div className="flex items-center gap-3">
              {/* 💡 วงกลมสีประจำ Metric: ดึงรหัสสีจาก Database */}
              <span 
                className={`w-3 h-3 rounded-full border-2 ${isActive ? 'border-white' : 'border-transparent'}`}
                style={{ backgroundColor: config.color || '#6366f1' }}
              ></span>
              
              {/* 💡 ชื่อเรียก (Label): ดึงจากฐานข้อมูล */}
              <span className={isActive ? "text-white" : "text-slate-900 dark:text-slate-200"}>
                {config.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}