// src/components/AlertPopup.jsx
import React, { useEffect, useState } from "react";
import { METRICS_CONFIG } from "../utils/metricsConfig";

export default function AlertPopup({ 
  alerts, 
  devices, 
  view, 
  dismissedAlerts, // รับจาก App
  setDismissedAlerts // รับจาก App
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

  const handleClose = (alert) => {
    const alertKey = `${alert.device_id}-${alert.time}-${alert.metric}`;
    // 💡 อัปเดต State กลางเพื่อให้ App.jsx ทราบและเปลี่ยนสถานะอุปกรณ์
    setDismissedAlerts(prev => [...prev, alertKey]);
  };

  const isHome = view === "home";
  
  // ปรับตำแหน่งให้เหมาะสมตามมุมมอง
  const positionClasses = isHome 
    ? "bottom-8 left-1/2 -translate-x-1/2 flex-row overflow-x-auto max-w-[95vw] px-4 pb-6 pt-2 snap-x hide-scrollbar" 
    : "top-24 right-6 flex-col items-end overflow-y-auto max-h-[75vh] pr-2";

  return (
    <div className={`fixed ${positionClasses} flex gap-4 z-[100] pointer-events-none transition-all duration-500`}>
      {activeAlerts.map((alert, index) => {
        const config = METRICS_CONFIG[alert.metric];
        const targetDevice = devices.find((d) => d.id === alert.device_id);
        const deviceName = targetDevice ? targetDevice.name : "Unknown Device";

        return (
          <div 
            key={`${alert.device_id}-${alert.time}-${index}`} 
            className="pointer-events-auto bg-white dark:bg-[#1e293b] text-slate-800 dark:text-white p-5 rounded-2xl shadow-[0_20px_50px_rgba(239,68,68,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border-l-8 border-red-500 animate-in slide-in-from-bottom-5 duration-300 min-w-[300px] flex-shrink-0 snap-center"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 animate-pulse">
                  <span className="text-xl">⚠️</span>
                </div>
                <div>
                  <div className="font-black text-sm uppercase tracking-wider text-red-600 dark:text-red-400">Critical Alert</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase leading-none">{deviceName}</div>
                </div>
              </div>
              <button 
                onClick={() => handleClose(alert)} 
                className="text-slate-300 hover:text-slate-500 dark:text-slate-500 dark:hover:text-white transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-2">
              <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">
                {config?.label} Exceeded
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-800 dark:text-white">{alert.value}</span>
                <span className="text-sm font-bold text-slate-400">{config?.unit}</span>
                <span className="ml-auto text-[10px] font-bold bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                  Limit: {config?.threshold}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 px-1">
              <span>Sensor Guard System</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {new Date(alert.time).toLocaleTimeString('th-TH')} น.
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}