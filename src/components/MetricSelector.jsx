import React from "react";
import { METRICS_CONFIG } from "../utils/metricsConfig";

export default function MetricSelector({ activeMetric, onMetricChange }) {
  return (
    <div className="flex gap-3 mt-4 flex-wrap justify-center">
      {Object.keys(METRICS_CONFIG).map((metricKey) => {
        const config = METRICS_CONFIG[metricKey];
        const isActive = metricKey === activeMetric;

        return (
          <button
            key={metricKey}
            // 💡 แก้ไข: ใช้ onMetricChange ให้ตรงกับ Props ที่รับมาเพื่อเปลี่ยนค่า State ใน App.jsx
            onClick={() => onMetricChange(metricKey)} 
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border shadow-sm ${
              isActive
                ? "bg-blue-600 text-white border-blue-600 shadow-blue-500/20 scale-105"
                : "bg-white dark:bg-[#283046] text-slate-600 dark:text-[#D0D2D6] border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <span 
                className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : ''}`}
                style={!isActive ? { backgroundColor: config.color } : {}}
              ></span>
              {config.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}