// src/components/AlertPanel.jsx
import React, { useState } from "react";

// 💡 รับ alerts และ config (จากฐานข้อมูล) มาใช้งาน
export default function AlertPanel({ alerts, config = {} }) {
  const [showAll, setShowAll] = useState(false);

  // 💡 กรณีไม่มีข้อมูลการแจ้งเตือน
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1e293b] p-8 rounded-3xl border-2 border-slate-300 dark:border-slate-700 mt-6 shadow-sm">
        <h3 className="font-black text-xs uppercase tracking-[0.3em] mb-6 flex items-center gap-3 text-slate-400 dark:text-slate-500">
          <span className="w-2 h-2 rounded-full bg-slate-300"></span> Alert History
        </h3>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4 border-2 border-slate-200 dark:border-slate-700">
            🔔
          </div>
          <p className="text-sm font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
            No system alerts recorded
          </p>
        </div>
      </div>
    );
  }

  const displayedAlerts = showAll ? alerts : alerts.slice(0, 5);

  return (
    <div className="bg-white dark:bg-[#1e293b] p-8 rounded-3xl border-2 border-slate-300 dark:border-slate-700 mt-6 shadow-md transition-all">
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-black text-xl flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-tighter">
          <span className="p-2 bg-rose-100 dark:bg-rose-500/20 rounded-lg text-rose-600">🔔</span> 
          Alert History
        </h3>
        
        {alerts.length > 5 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-5 py-2 rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-900 hover:text-white dark:hover:bg-indigo-600 transition-all shadow-sm"
          >
            {showAll ? "SHOW LESS" : `VIEW ALL INCIDENTS (${alerts.length})`}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {displayedAlerts.map((alert, index) => {
          // 💡 ดึงค่าคอนฟิกจาก Props ที่ส่งมาจากฐานข้อมูล
          const metricConfig = config[alert.metric];
          
          return (
            <div
              key={`${alert.time}-${index}`}
              className="flex justify-between items-center bg-slate-50 dark:bg-[#0f172a] px-6 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500/50 transition-all group"
            >
              <div className="flex items-center gap-5">
                <div className="w-3 h-12 rounded-full bg-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.4)]"></div>
                
                <div className="flex flex-col">
                  <span className="font-black text-lg text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors uppercase tracking-tight">
                    {/* ใช้ Label จาก DB หรือชื่อ metric ดั้งเดิม */}
                    {metricConfig?.label || alert.metric} ANOMALY
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {new Date(alert.time).toLocaleString('en-GB', { 
                        hour12: false, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                      })}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      ID: {alert.device_id?.slice(-6) || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right bg-white dark:bg-[#1e293b] px-4 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-800">
                <span className="font-black text-rose-600 dark:text-rose-500 text-2xl block leading-none mb-1">
                  {alert.value}
                </span>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                   UNIT: {metricConfig?.unit || '---'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-8 pt-6 border-t-2 border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            DATALOGGER ACTIVE
          </span>
          <span className="w-[2px] h-3 bg-slate-200 dark:bg-slate-800"></span>
          <span>SECURITY ENCRYPTED</span>
        </div>
        <span>© 2026 SERVERGUARD PRO MONITORING</span>
      </div>
    </div>
  );
}