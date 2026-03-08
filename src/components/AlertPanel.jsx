import React, { useState } from "react";
import { METRICS_CONFIG } from "../utils/metricsConfig";

export default function AlertPanel({ alerts }) {
  const [showAll, setShowAll] = useState(false); // 💡 State ซ่อน/แสดงทั้งหมด

  if (!alerts || alerts.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow mt-4">
        <h3 className="font-semibold mb-2">Alert History</h3>
        <p className="text-sm text-gray-500">No alerts found</p>
      </div>
    );
  }

  // 💡 กรองข้อมูล: ถ้าไม่เปิด showAll ให้แสดงแค่ 5 อันดับแรก
  const displayedAlerts = showAll ? alerts : alerts.slice(0, 5);

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-lg">Alert History</h3>
        
        {/* 💡 ปุ่มกดดูทั้งหมด (จะแสดงก็ต่อเมื่อมีข้อมูลเกิน 5 อัน) */}
        {alerts.length > 5 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            {showAll ? "ย่อหน้าต่าง" : `ดูทั้งหมด (${alerts.length})`}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {displayedAlerts.map((alert, index) => {
          const config = METRICS_CONFIG[alert.metric];
          return (
            <div
              key={index}
              className="flex justify-between items-center bg-red-100 dark:bg-red-900 px-4 py-2.5 rounded-lg border-l-4 border-red-500"
            >
              <div className="flex flex-col">
                <span className="font-semibold text-red-800 dark:text-red-200">
                  {config?.label || alert.metric}
                </span>
                <span className="text-xs text-red-600 dark:text-red-300">
                  {new Date(alert.time).toLocaleString('th-TH')}
                </span>
              </div>
              <span className="font-black text-red-700 dark:text-red-100 text-lg">
                {alert.value} <span className="text-sm">{config?.unit}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}