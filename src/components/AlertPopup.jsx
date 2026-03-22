// src/components/AlertPopup.jsx
import React, { useEffect, useState } from "react";

export default function AlertPopup({ 
  alerts, 
  devices, 
  view, 
  dismissedAlerts, 
  setDismissedAlerts,
  config: metricsConfig // 💡 รับ dynamic config จากฐานข้อมูลผ่าน props
}) {
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 💡 เช็คความปลอดภัย: ถ้าข้อมูลหลักหรือ Config ยังไม่มี ให้ไม่แสดงผลทันที
  if (!alerts || !Array.isArray(alerts) || !devices || !dismissedAlerts || !metricsConfig) return null;

  const getStableKey = (alert) => {
    return alert.metric === "status" 
      ? `${alert.device_id}-status-critical` 
      : `${alert.device_id}-${alert.time}-${alert.metric}`;
  };

  const activeAlerts = alerts.filter(alert => {
    if (!alert) return false;
    const alertTime = new Date(alert.time).getTime();
    
    // แจ้งเตือนสถานะ (Offline) จะค้างไว้จนกว่าจะกดปิด, ส่วน Metric อื่นจะโชว์แค่ 10 นาที
    const isFresh = alert.metric === "status" 
      ? true 
      : (currentTime - alertTime) / 60000 <= 10;

    const alertKey = getStableKey(alert);
    return isFresh && !dismissedAlerts.includes(alertKey);
  });

  if (activeAlerts.length === 0) return null;

  const handleClose = (alert) => {
    const alertKey = getStableKey(alert);
    setDismissedAlerts(prev => [...prev, alertKey]);
  };

  const handleDismissAll = () => {
    const allKeys = activeAlerts.map(alert => getStableKey(alert));
    setDismissedAlerts(prev => [...new Set([...prev, ...allKeys])]);
  };

  const isHome = view === "home";
  const positionClasses = isHome 
    ? "bottom-10 left-1/2 -translate-x-1/2 flex-col items-center max-w-[95vw] px-6 pb-8 pt-4" 
    : "top-24 right-8 flex-col items-end overflow-y-auto max-h-[75vh] pr-4";

  return (
    <div className={`fixed ${positionClasses} flex gap-4 z-[100] pointer-events-none transition-all duration-500`}>
      
      {activeAlerts.length > 1 && (
        <button
          onClick={handleDismissAll}
          className="pointer-events-auto bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] px-6 py-2 rounded-full border-2 border-white dark:border-slate-400 shadow-xl shadow-rose-500/40 uppercase tracking-[0.2em] transition-all active:scale-95 mb-2 animate-in fade-in zoom-in duration-300"
        >
          ✕ Dismiss All ({activeAlerts.length})
        </button>
      )}

      <div className={`flex ${isHome ? 'flex-row overflow-x-auto snap-x hide-scrollbar gap-6 w-full justify-center' : 'flex-col gap-4'}`}>
        {activeAlerts.map((alert, index) => {
          // 💡 ดึงคอนฟิกจากตัวแปรที่รับมาจาก Supabase
          const config = metricsConfig[alert.metric];
          const targetDevice = devices.find((d) => d.id === alert.device_id);
          const deviceName = targetDevice?.name || "Unknown Node";
          const isCriticalStatus = alert.metric === "status";

          return (
            <div 
              key={`${alert.device_id}-${alert.metric}-${index}`} 
              className={`pointer-events-auto border-4 p-6 rounded-[2rem] shadow-2xl transition-all duration-500 min-w-[320px] flex-shrink-0 snap-center
                ${isCriticalStatus 
                  ? "bg-rose-900 border-white text-white animate-[pulse_1.5s_infinite] shadow-rose-900/50" 
                  : "bg-white dark:bg-[#1e293b] border-slate-900 dark:border-slate-600 border-l-[12px] border-l-rose-600 shadow-rose-500/20"
                }
              `}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg animate-bounce ${isCriticalStatus ? 'bg-white text-rose-900' : 'bg-rose-600 text-white'}`}>
                    <span className="text-2xl">{isCriticalStatus ? "💀" : "⚠️"}</span>
                  </div>
                  <div>
                    <div className={`font-black text-xs uppercase tracking-[0.2em] ${isCriticalStatus ? 'text-rose-200' : 'text-rose-600'}`}>
                      {isCriticalStatus ? "INFRASTRUCTURE FAILURE" : "SENSOR VIOLATION"}
                    </div>
                    <div className="text-sm font-black uppercase leading-tight">{deviceName}</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleClose(alert)} 
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all border-2 border-transparent ${isCriticalStatus ? 'bg-white/20 text-white hover:bg-white hover:text-rose-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-600 hover:text-white'}`}
                >
                  <span className="text-xl font-bold">✕</span>
                </button>
              </div>

              <div className={`p-4 rounded-xl border-2 mb-3 ${isCriticalStatus ? 'bg-white/10 border-white/20' : 'bg-slate-900 dark:bg-[#0f172a] border-slate-800 dark:border-slate-700'}`}>
                {isCriticalStatus ? (
                  <div className="text-center">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-rose-200">Network Connection Lost</div>
                    <div className="text-2xl font-black text-white italic animate-pulse">OFFLINE</div>
                    <div className="text-[9px] font-black bg-white text-rose-900 inline-block px-3 py-1 rounded-full mt-3 uppercase tracking-tighter">
                      Immediate Maintenance Required
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {config?.label || alert.metric} LEVEL ABNORMAL
                    </div>
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white">{alert.value}</span>
                        <span className="text-sm font-bold text-rose-500">{config?.unit || '---'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-500 block uppercase">LIMIT</span>
                        <span className="text-sm font-black text-white">
                          {alert.value < (config?.threshold_min ?? -Infinity) ? config?.threshold_min : config?.threshold}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className={`flex justify-between items-center text-[10px] font-black uppercase tracking-widest px-1 ${isCriticalStatus ? 'text-rose-200' : 'text-slate-500'}`}>
                <span>{isCriticalStatus ? "SECURITY PROTOCOL 01" : "INCIDENT LOGGED"}</span>
                <span className={`flex items-center gap-2 px-2 py-1 rounded ${isCriticalStatus ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <span className={`w-2 h-2 rounded-full animate-ping ${isCriticalStatus ? 'bg-white' : 'bg-rose-600'}`}></span>
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