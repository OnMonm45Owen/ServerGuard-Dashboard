import React from "react";
import { METRICS_CONFIG } from "../utils/metricsConfig";

export default function MetricSelector({ activeMetric, onMetricChange }) {
  return (
    <div className="flex gap-4 mt-6 flex-wrap justify-center">
      {Object.keys(METRICS_CONFIG).map((metricKey) => {
        const config = METRICS_CONFIG[metricKey];
        const isActive = metricKey === activeMetric;

        return (
          <button
            key={metricKey}
            onClick={() => onMetricChange(metricKey)} 
            className={`
              /* 💡 ปรับให้เป็นเส้นขอบหนา 2px ตลอดเวลา */
              px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 border-2 
              
              ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900 scale-110 shadow-xl z-10 dark:bg-indigo-600 dark:border-indigo-400"
                  : "bg-white dark:bg-[#1e293b] text-slate-900 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md"
              }
            `}
          >
            <div className="flex items-center gap-3">
              {/* 💡 วงกลมสีประจำ Metric: ทำให้ใหญ่ขึ้นและชัดขึ้น */}
              <span 
                className={`w-3 h-3 rounded-full border-2 ${isActive ? 'border-white' : 'border-transparent'}`}
                style={{ backgroundColor: config.color }}
              ></span>
              
              {/* 💡 ตัวหนังสือ: บังคับให้เป็นตัวหนาที่สุด */}
              <span className={isActive ? "text-white" : "text-slate-900 dark:text-slate-200"}>
                {config.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}