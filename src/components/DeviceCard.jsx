import React from "react";
import { METRICS_CONFIG } from "../utils/metricsConfig";

export default function DeviceCard({ device, onOpen, pingResult, onPing }) {
  // 💡 ปรับปรุงการแสดงสถานะเพื่อรองรับ Standby และ Server Offline
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
      case "standby":
        return {
          label: "Standby / No Data",
          color: "bg-blue-600",
          shadow: "shadow-blue-500/30",
          animate: ""
        };
      default:
        return {
          label: "Server Offline",
          color: "bg-rose-700",
          shadow: "shadow-rose-500/40",
          animate: "animate-pulse"
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

  const formatValue = (val) => {
    if (val === null || val === undefined) return "--";
    if (typeof val === 'number') return val.toFixed(1);
    return val;
  };

  return (
    <div className={`
      bg-white dark:bg-[#1e293b] 
      border-2 border-slate-900 dark:border-slate-700 
      rounded-2xl p-6 transition-all duration-300
      shadow-xl hover:shadow-2xl hover:border-indigo-500
      
      /* 💡 ขอบบนแสดงสถานะแบบหนาพิเศษ (High Contrast) */
      border-t-[8px] ${
        device.status === 'warning' ? 'border-amber-500 animate-[pulse_2s_infinite]' : 
        device.status === 'online' ? 'border-emerald-500' : 
        device.status === 'standby' ? 'border-blue-600' : 
        'border-rose-600'
      }
    `}>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-1">
            {device.name}
          </h3>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">
            IP: {device.ip_address || "NOT CONFIGURED"}
          </span>
        </div>
        <span
          className={`text-[10px] px-3 py-1.5 rounded-lg text-white font-black uppercase tracking-wider shadow-lg ${status.color} ${status.shadow} ${status.animate}`}
        >
          {status.label}
        </span>
      </div>

      {/* Grid ข้อมูลเซ็นเซอร์ */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Object.keys(METRICS_CONFIG).filter(key => !METRICS_CONFIG[key].isMultiLine).map((key) => {
          const config = METRICS_CONFIG[key];
          const hasAlert = isValueAlert(key, device[key]);

          return (
            <div key={key} className="bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-slate-700 p-3 rounded-xl">
              <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase flex items-center gap-1.5 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }}></span>
                {config.label}
              </span>

              <div className={`text-2xl font-black ${hasAlert ? 'text-rose-600 animate-bounce' : 'text-slate-900 dark:text-slate-100'}`}>
                {formatValue(device[key])}
                <span className="text-sm font-bold opacity-70 ml-1">{config.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔘 Manual Ping Section (ปุ่มตรวจสอบเซิร์ฟเวอร์) */}
      <div className="mt-auto pt-4 border-t-2 border-slate-100 dark:border-slate-800">
        <button
          onClick={() => onPing(device.id, device.ip_address)}
          disabled={pingResult?.loading}
          className="
            w-full 
            bg-slate-900 dark:bg-slate-700 
            text-white py-3 rounded-xl 
            font-black text-[10px] uppercase tracking-[0.2em] 
            border-2 border-slate-900 dark:border-slate-500 
            hover:bg-indigo-600 dark:hover:bg-indigo-500 
            transition-all mb-3 active:translate-y-1 active:shadow-none
          "
        >
          {pingResult?.loading ? "🛰️ Testing Connection..." : "Check Server Ping"}
        </button>

        {/* ผลลัพธ์จากการ Ping (Visual Clarity) */}
        {pingResult && !pingResult.loading && (
          <div className={`
            p-3 rounded-xl border-2 flex justify-between items-center animate-in slide-in-from-top-2
            ${pingResult.success ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-rose-50 border-rose-500 text-rose-700'}
          `}>
            <span className="font-black text-[10px] uppercase tracking-tighter">
              {pingResult.success ? "✓ Server Reachable" : "✗ Request Timeout"}
            </span>
            <span className="font-mono font-black text-sm">
              {pingResult.success ? `${pingResult.latency}ms` : "---"}
            </span>
          </div>
        )}
      </div>

      <button
        onClick={() => onOpen(device)}
        className="
        mt-4
        w-full 
        bg-slate-100 dark:bg-indigo-600 
        hover:bg-indigo-200 dark:hover:bg-indigo-500 
        text-slate-900 dark:text-white py-3 rounded-xl 
        font-black text-xs uppercase tracking-widest 
        transition-all duration-200
        border-2 border-slate-900 dark:border-indigo-400
        "
      >
        View Analytics
      </button>
    </div>
  );
}