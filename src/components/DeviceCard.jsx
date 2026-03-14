// src/components/DeviceCard.jsx
import React from "react";
import { METRICS_CONFIG } from "../utils/metricsConfig";

export default function DeviceCard({ device, onOpen, pingResult, onPing }) {
  
  // 💡 ฟังก์ชันจัดการสีและข้อความสถานะ (รวม Disconnect สีส้ม)
  const getStatusDisplay = () => {
    switch (device.status) {
      case "online":
        return { label: "Online", color: "bg-emerald-600", shadow: "shadow-emerald-500/30", animate: "" };
      case "warning":
        return { label: "Warning", color: "bg-amber-500", shadow: "shadow-amber-500/30", animate: "animate-pulse" };
      case "standby":
        return { label: "Standby", color: "bg-blue-600", shadow: "shadow-blue-500/30", animate: "" };
      
      // 💡 กรณีข้อมูลเข้าแต่ปิงไม่ติด (Disconnect - สีส้ม)
      case "disconnect":
        return { 
          label: "P2P Disconnected", 
          color: "bg-orange-600", 
          shadow: "shadow-orange-500/30", 
          animate: "animate-pulse" 
        };

      default:
        return { label: "Offline", color: "bg-rose-700", shadow: "shadow-rose-500/40", animate: "animate-pulse" };
    }
  };

  const status = getStatusDisplay();

  // ตรวจสอบว่าค่าเซ็นเซอร์ผิดปกติหรือไม่
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
    return typeof val === 'number' ? val.toFixed(1) : val;
  };

  return (
    <div className={`
      bg-white dark:bg-[#1e293b] border-2 border-slate-900 dark:border-slate-700 rounded-[2rem] p-6 transition-all border-t-[10px] shadow-xl hover:scale-[1.02] duration-300
      ${
        device.status === 'warning' ? 'border-amber-500' : 
        device.status === 'online' ? 'border-emerald-500' : 
        device.status === 'standby' ? 'border-blue-600' : 
        device.status === 'disconnect' ? 'border-orange-600' : 
        'border-rose-600'
      }
    `}>

      {/* Header: Name & Status */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
             <span className="bg-slate-900 text-white dark:bg-indigo-600 text-[10px] font-black px-2 py-0.5 rounded uppercase">{device.id}</span>
             <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate">{device.name}</h3>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest flex items-center gap-1">
              📍 {device.location || "Unknown Location"}
            </span>
            <span className="text-[9px] text-slate-400 font-bold tracking-tighter">
              IP: {device.ip_address || "NO CONFIG"}
            </span>
          </div>
        </div>
        <span className={`text-[9px] px-3 py-1.5 rounded-xl text-white font-black uppercase tracking-wider shadow-lg ${status.color} ${status.shadow} ${status.animate}`}>
          {status.label}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {Object.keys(METRICS_CONFIG).filter(key => !METRICS_CONFIG[key].isMultiLine).map((key) => {
          const config = METRICS_CONFIG[key];
          const hasAlert = isValueAlert(key, device[key]);

          return (
            <div key={key} className="bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-100 dark:border-slate-800 p-3 rounded-2xl">
              <span className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-1.5 mb-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }}></span>
                {config.label}
              </span>
              <div className={`text-xl font-black ${hasAlert ? 'text-rose-600 animate-bounce' : 'text-slate-900 dark:text-slate-100'}`}>
                {formatValue(device[key])}<span className="text-[10px] font-bold opacity-50 ml-0.5">{config.unit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ping & Action Section */}
      <div className="space-y-3">
        <button
          onClick={() => onPing(device.id, device.ip_address)}
          disabled={pingResult?.loading}
          className="w-full bg-slate-900 dark:bg-slate-800 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] border-2 border-transparent hover:border-indigo-500 transition-all flex items-center justify-center gap-2"
        >
          {pingResult?.loading ? (
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : "Check Connectivity"}
        </button>

        {pingResult && !pingResult.loading && (
          <div className={`p-3 rounded-xl border-2 flex justify-between items-center animate-in zoom-in duration-200 ${pingResult.success ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-rose-500/10 border-rose-500/50 text-rose-500'}`}>
            <span className="font-black text-[9px] uppercase">{pingResult.success ? "✓ Link Active" : "✗ Link Failed"}</span>
            <span className="font-mono font-black text-xs">{pingResult.success ? `${pingResult.latency}ms` : "TIMEOUT"}</span>
          </div>
        )}

        <button
          onClick={() => onOpen(device)}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-b-4 border-indigo-800 active:border-b-0 active:translate-y-1"
        >
          View Analytics
        </button>
      </div>
    </div>
  );
}