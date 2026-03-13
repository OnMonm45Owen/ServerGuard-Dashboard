import React from "react";
import { METRICS_CONFIG } from "../utils/metricsConfig";

export default function DeviceCard({ device, onOpen }) {
  const getStatusDisplay = () => {
    switch (device.status) {
      case "online":
        return {
          label: "Online",
          color: "bg-emerald-600",
          shadow: "shadow-emerald-500/30",
          animate: ""
        };
      case "warning":
        return {
          label: "Warning",
          color: "bg-amber-500",
          shadow: "shadow-amber-500/30",
          animate: "animate-pulse"
        };
      default:
        return {
          label: "Offline",
          color: "bg-slate-500",
          shadow: "",
          animate: ""
        };
    }
  };

  const status = getStatusDisplay();

  const isValueAlert = (metricKey, value) => {
    if (value === null || value === undefined) return false;
    const config = METRICS_CONFIG[metricKey];
    if (!config) return false;
    if (config.threshold && value > config.threshold) return true;
    if (config.thresholdMin && value < config.thresholdMin) return true;
    return false;
  };

  return (
    <div className={`
      /* 💡 พื้นหลัง: ปรับให้ขาวสนิทในโหมดสว่าง และเข้มชัดในโหมดมืด */
      bg-white dark:bg-[#1e293b] 
      
      /* 💡 เส้นขอบหลัก: ปรับเป็น border-2 เพื่อความหนา และใช้สีที่ตัดกันชัดเจน */
      border-2 border-slate-300 dark:border-slate-600 
      
      rounded-2xl p-6 transition-all duration-300
      
      /* 💡 เงา: เพิ่มความลึกให้ Card ลอยเด่นขึ้น */
      shadow-md hover:shadow-2xl hover:border-blue-400 dark:hover:border-indigo-400
      
      /* ขอบบนแสดงสถานะ */
      border-t-[6px] ${device.status === 'warning'
        ? 'border-amber-500 animate-[pulse_2s_infinite]'
        : device.status === 'online'
          ? 'border-emerald-500'
          : 'border-slate-400'
      }
    `}>

      <div className="flex justify-between items-start mb-6">
        <div>
          {/* 💡 ชื่ออุปกรณ์: ปรับสีให้เข้มที่สุด (Slate-900) เพื่อความชัดเจน */}
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-1">
            {device.name}
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
            ID: {device.id}
          </span>
        </div>
        <span
          className={`text-xs px-3 py-1.5 rounded-lg text-white font-black uppercase tracking-wider shadow-md ${status.color} ${status.shadow} ${status.animate}`}
        >
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {Object.keys(METRICS_CONFIG).filter(key => !METRICS_CONFIG[key].isMultiLine).map((key) => {
          const config = METRICS_CONFIG[key];
          const hasAlert = isValueAlert(key, device[key]);

          // 💡 ฟังก์ชันจัดการตัวเลขเพื่อป้องกันการแสดงผลเกินกรอบ
          const formatValue = (val) => {
            if (val === null || val === undefined) return "--";
            if (typeof val === 'number') {
              // จำกัดทศนิยมให้แสดงเพียง 1 ตำแหน่งสำหรับทุก Metric ที่เป็นตัวเลข
              // ซึ่งเพียงพอสำหรับการอ่านค่า Voltage ที่ไม่ให้ยาวเกินกรอบแล้วครับ
              return val.toFixed(1);
            }
            return val;
          };

          return (
            <div key={key} className="bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-slate-700 p-3 rounded-xl">
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }}></span>
                {config.label}
              </span>

              {/* 💡 เรียกใช้ formatValue(device[key]) แทนการแสดงผลค่าตรงๆ */}
              <div className={`text-2xl font-black ${hasAlert ? 'text-rose-600 animate-bounce' : 'text-slate-900 dark:text-slate-100'}`}>
                {formatValue(device[key])}
                <span className="text-sm font-bold opacity-70 ml-1">{config.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onOpen(device)}
        className="
    w-full 
    bg-slate-900 dark:bg-indigo-600 
    hover:bg-blue-600 dark:hover:bg-indigo-500 
    text-white py-4 rounded-xl 
    font-black text-sm uppercase tracking-widest 
    transition-all duration-200
    shadow-[0_4px_0_0_rgba(0,0,0,1)] dark:shadow-[0_4px_0_0_rgba(67,56,202,1)]
    active:translate-y-1 active:shadow-none
    border-2 border-slate-900 dark:border-indigo-400/50
  "
      >
        View Analytics
      </button>
    </div>
  );
}