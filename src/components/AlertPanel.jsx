import React, { useState } from "react";
import { METRICS_CONFIG } from "../utils/metricsConfig";

export default function AlertPanel({ alerts }) {
  const [showAll, setShowAll] = useState(false);

  // กรณีไม่มีข้อมูลการแจ้งเตือน
  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-[#283046] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 mt-6 transition-colors duration-300">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-slate-700 dark:text-[#E0E2E7]">
          <span className="text-xl">📊</span> Alert History
        </h3>
        <div className="flex flex-col items-center justify-center py-8 opacity-40">
          <span className="text-4xl mb-2">🔔</span>
          <p className="text-sm font-medium uppercase tracking-widest">No alerts found</p>
        </div>
      </div>
    );
  }

  // กรองข้อมูล: แสดง 5 อันดับแรก หรือทั้งหมดตาม State
  const displayedAlerts = showAll ? alerts : alerts.slice(0, 5);

  return (
    <div className="bg-white dark:bg-[#283046] p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 mt-6 transition-all duration-300">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-lg flex items-center gap-2 text-slate-700 dark:text-[#E0E2E7]">
          <span className="text-xl">🔔</span> Alert History
        </h3>
        
        {/* ปุ่มกดดูทั้งหมด */}
        {alerts.length > 5 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-black uppercase tracking-wider text-blue-600 dark:text-indigo-400 hover:opacity-70 transition-opacity bg-blue-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-indigo-500/20"
          >
            {showAll ? "Show Less" : `View All (${alerts.length})`}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayedAlerts.map((alert, index) => {
          const config = METRICS_CONFIG[alert.metric];
          return (
            <div
              key={index}
              className="flex justify-between items-center bg-white dark:bg-[#161D31]/50 px-4 py-3 rounded-xl border border-slate-100 dark:border-slate-700/30 hover:border-red-300 dark:hover:border-red-500/50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                {/* สถานะสัญลักษณ์หน้าแถว */}
                <div className="w-2 h-10 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]"></div>
                
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 dark:text-[#D0D2D6] group-hover:text-red-500 transition-colors">
                    {config?.label || alert.metric}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                    {new Date(alert.time).toLocaleString('th-TH', { 
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' 
                    })}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-rose-500 dark:text-rose-400 text-xl block leading-none">
                  {alert.value}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{config?.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* ส่วนท้ายแสดงระบบป้องกัน */}
      <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-300 dark:text-slate-600 uppercase tracking-widest">
        <span>Security Log System</span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Active Monitoring
        </span>
      </div>
    </div>
  );
}