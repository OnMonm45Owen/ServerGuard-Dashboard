import React from "react";
import { METRICS_CONFIG } from "../utils/metricsConfig";

export default function DeviceCard({ device, onOpen }) {
  // 💡 กำหนดการแสดงผลตามสถานะของอุปกรณ์ พร้อมเงา (Shadow) และสีตามธีมใหม่
  const getStatusDisplay = () => {
    switch (device.status) {
      case "online":
        return {
          label: "Online",
          color: "bg-emerald-500",
          shadow: "shadow-emerald-500/20",
          animate: ""
        };
      case "warning":
        return {
          label: "Warning",
          color: "bg-amber-500",
          shadow: "shadow-amber-500/20",
          animate: "animate-pulse" // กะพริบที่ป้ายสถานะ
        };
      default:
        return {
          label: "Offline",
          color: "bg-slate-400",
          shadow: "",
          animate: ""
        };
    }
  };

  const status = getStatusDisplay();

  // 💡 เช็คว่าค่านั้นๆ ผิดปกติหรือไม่ (รองรับทั้ง Max และ Min threshold)
  const isValueAlert = (metricKey, value) => {
    if (value === null || value === undefined) return false;
    const config = METRICS_CONFIG[metricKey];
    if (!config) return false;

    // เช็คค่าสูงสุด
    if (config.threshold && value > config.threshold) return true;
    // เช็คค่าต่ำสุด (เช่น Humidity เพื่อป้องกันไฟฟ้าสถิต)
    if (config.thresholdMin && value < config.thresholdMin) return true;

    return false;
  };

  return (
    <div className={`bg-white dark:bg-[#283046] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 p-6 transition-all hover:shadow-xl dark:hover:bg-[#2F3854] border-t-4 transition-colors duration-300 ${
      device.status === 'warning'
        ? 'border-amber-500 animate-[pulse_2s_infinite]' // 💡 กะพริบขอบสีส้มเมื่อสถานะเป็น Warning
        : device.status === 'online'
          ? 'border-emerald-500'
          : 'border-transparent'
    }`}>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-[#E0E2E7]">
            {device.name}
          </h3>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Device ID: {device.id}</span>
        </div>
        <span
          className={`text-[10px] px-2.5 py-1 rounded-lg text-white font-black uppercase tracking-wider shadow-lg ${status.color} ${status.shadow} ${status.animate}`}
        >
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* แสดงผลเซ็นเซอร์หลักตาม config */}
        {Object.keys(METRICS_CONFIG).filter(key => !METRICS_CONFIG[key].isMultiLine).map((key) => {
          const config = METRICS_CONFIG[key];
          const hasAlert = isValueAlert(key, device[key]);

          return (
            <div key={key} className="bg-[#F8FAFC] dark:bg-[#161D31]/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/30 transition-colors">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }}></span>
                {config.label}
              </span>
              <div className={`text-lg font-black mt-0.5 ${hasAlert ? 'text-rose-500 animate-pulse' : 'text-slate-700 dark:text-[#D0D2D6]'}`}>
                {device[key] !== null ? device[key] : "--"}
                <span className="text-xs font-medium opacity-60 ml-1">{config.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onOpen(device)}
        className="w-full bg-blue-600 hover:bg-blue-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/25 dark:shadow-indigo-500/20 active:scale-95"
      >
        View Analytics
      </button>
    </div>
  );
}