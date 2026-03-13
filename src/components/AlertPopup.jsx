// src/components/AlertPopup.jsx
import React, { useEffect, useState } from "react";
import { METRICS_CONFIG } from "../utils/metricsConfig";

export default function AlertPopup({ 
  alerts, 
  devices, 
  view, 
  dismissedAlerts, 
  setDismissedAlerts 
}) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!alerts || alerts.length === 0) return null;

  const activeAlerts = alerts.filter(alert => {
    const alertTime = new Date(alert.time).getTime();
    const isFresh = (currentTime - alertTime) / 60000 <= 10;
    const alertKey = `${alert.device_id}-${alert.time}-${alert.metric}`;
    return isFresh && !dismissedAlerts.includes(alertKey);
  });

  if (activeAlerts.length === 0) return null;

  // 💡 ฟังก์ชันปิดการแจ้งเตือนอันเดียว
  const handleClose = (alert) => {
    const alertKey = `${alert.device_id}-${alert.time}-${alert.metric}`;
    setDismissedAlerts(prev => [...prev, alertKey]);
  };

  // 💡 ฟังก์ชันปิดทั้งหมด (Dismiss All)
  const handleDismissAll = () => {
    const allKeys = activeAlerts.map(alert => `${alert.device_id}-${alert.time}-${alert.metric}`);
    setDismissedAlerts(prev => [...new Set([...prev, ...allKeys])]);
  };

  const isHome = view === "home";
  const positionClasses = isHome 
    ? "bottom-10 left-1/2 -translate-x-1/2 flex-col items-center max-w-[95vw] px-6 pb-8 pt-4 overflow-visible" 
    : "top-24 right-8 flex-col items-end overflow-y-auto max-h-[75vh] pr-4";

  return (
    <div className={`fixed ${positionClasses} flex gap-4 z-[100] pointer-events-none transition-all duration-500`}>
      
      {/* 💡 ปุ่ม Dismiss All: แสดงเมื่อมีมากกว่า 1 อัน */}
      {activeAlerts.length > 1 && (
        <button
          onClick={handleDismissAll}
          className="
            pointer-events-auto
            bg-rose-600 hover:bg-rose-700 
            text-white font-black text-[10px] 
            px-6 py-2 rounded-full 
            border-2 border-white dark:border-slate-400 
            shadow-xl shadow-rose-500/40 
            uppercase tracking-[0.2em] 
            transition-all active:scale-95 mb-2
            animate-in fade-in zoom-in duration-300
          "
        >
          ✕ Dismiss All ({activeAlerts.length})
        </button>
      )}

      {/* รายการ Alert รายอัน */}
      <div className={`flex ${isHome ? 'flex-row overflow-x-auto snap-x hide-scrollbar gap-6 w-full justify-center' : 'flex-col gap-4'}`}>
        {activeAlerts.map((alert, index) => {
          const config = METRICS_CONFIG[alert.metric];
          const targetDevice = devices.find((d) => d.id === alert.device_id);
          const deviceName = targetDevice ? targetDevice.name : "Unknown Device";

          return (
            <div 
              key={`${alert.device_id}-${alert.time}-${index}`} 
              className="
                pointer-events-auto 
                bg-white dark:bg-[#1e293b] 
                border-2 border-slate-300 dark:border-slate-600 
                border-l-[12px] border-l-rose-600 
                p-6 rounded-2xl 
                shadow-2xl shadow-rose-500/20
                animate-in slide-in-from-right-10 duration-500
                min-w-[320px] flex-shrink-0 snap-center
              "
            >
              {/* ส่วนบน (Icon & Close) */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg animate-bounce">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div>
                    <div className="font-black text-xs uppercase tracking-[0.2em] text-rose-600">CRITICAL ALERT</div>
                    <div className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight">{deviceName}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleClose(alert)} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-600 hover:text-white transition-all border-2 border-transparent"
                >
                  <span className="text-xl font-bold">✕</span>
                </button>
              </div>

              {/* ส่วนค่าข้อมูล (Data Box) */}
              <div className="bg-slate-900 dark:bg-[#0f172a] p-4 rounded-xl border-2 border-slate-800 dark:border-slate-700 mb-3">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {config?.label} VIOLATION
                </div>
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-white">{alert.value}</span>
                    <span className="text-sm font-bold text-rose-500">{config?.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-slate-500 block uppercase">LIMIT</span>
                    <span className="text-sm font-black text-white">{config?.threshold}</span>
                  </div>
                </div>
              </div>

              {/* ส่วนท้าย (System Info) */}
              <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">
                <span>SYSTEM DEFENSE ACTIVE</span>
                <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                  {new Date(alert.time).toLocaleTimeString('en-GB', { hour12: false })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}