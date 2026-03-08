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
          animate: "animate-pulse" // 🚨 กะพริบเพื่อเตือนความผิดปกติ
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

  // 💡 เช็คว่าค่านั้นๆ เกินขีดจำกัดหรือไม่
  const isExceeded = (metric, value) => {
    return value > METRICS_CONFIG[metric].threshold;
  };

  return (
    <div className={`bg-white dark:bg-[#283046] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 p-6 transition-all hover:shadow-xl dark:hover:bg-[#2F3854] border-t-4 ${device.status === 'warning' ? 'border-amber-500' : 'border-transparent'}`}>
      
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-700 dark:text-[#E0E2E7]">
            {device.name}
          </h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Device ID: {device.id}</span>
        </div>
        <span
          className={`text-[10px] px-2.5 py-1 rounded-lg text-white font-black uppercase tracking-wider shadow-lg ${status.color} ${status.shadow} ${status.animate}`}
        >
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* แสดงผลเซ็นเซอร์ 4 ตัว */}
        {Object.keys(METRICS_CONFIG).map((key) => (
          <div key={key} className="bg-slate-50 dark:bg-[#161D31]/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/30">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
              {key === 'current_amp' ? '⚡ ' : key === 'temperature' ? '🌡️ ' : key === 'humidity' ? '💧 ' : '🔊 '}
              {METRICS_CONFIG[key].label}
            </span>
            <div className={`text-lg font-black mt-0.5 ${isExceeded(key, device[key]) ? 'text-rose-500' : 'text-slate-700 dark:text-[#D0D2D6]'}`}>
              {device[key] ?? "--"} <span className="text-xs font-medium opacity-60">{METRICS_CONFIG[key].unit}</span>
            </div>
          </div>
        ))}
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