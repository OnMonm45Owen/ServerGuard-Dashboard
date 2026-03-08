import React from "react";
import MetricChart from "../components/MetricChart";
import MetricSelector from "../components/MetricSelector";
import TimeRangeSelector from "../components/TimeRangeSelector";
import AlertPanel from "../components/AlertPanel";
import { METRICS_CONFIG } from "../utils/metricsConfig";

export default function AnalyticsView({
  device,
  history,
  activeMetric,
  onMetricChange,
  timeRange,
  setTimeRange,
  selectedDate,
  setSelectedDate,
  alerts,
  onBack,
  darkMode
}) {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* ส่วนหัวและปุ่มย้อนกลับ */}
      <button 
        onClick={onBack} 
        className="mb-6 flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-indigo-400 font-bold transition-all group"
      >
        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span> 
        Back to Dashboard
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            {device.name}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Real-time Performance Analysis</p>
        </div>
        
        <div className="bg-white dark:bg-[#283046] p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50">
          <TimeRangeSelector
            range={timeRange}
            setRange={setTimeRange}
            date={selectedDate}
            setDate={setSelectedDate}
          />
        </div>
      </div>

      {/* 📊 ส่วนแสดงผลกราฟ */}
      <div className="bg-white dark:bg-[#283046] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700/50 p-6 mb-6 transition-colors">
        <div className="flex justify-center items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: METRICS_CONFIG[activeMetric].color }}></div>
            <span className="font-bold text-slate-700 dark:text-[#D0D2D6] uppercase tracking-widest text-xs">
              {METRICS_CONFIG[activeMetric].label} Monitoring
            </span>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          <MetricChart
            history={history}
            activeMetric={activeMetric}
            config={METRICS_CONFIG}
            range={timeRange}
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* 🔘 Select Metric จัดให้อยู่กึ่งกลางใต้กราฟ */}
      <div className="flex flex-col items-center mb-12">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4">
          Select Analysis Metric
        </h3>
        <div className="flex flex-wrap justify-center gap-4 w-full max-w-2xl">
          <MetricSelector
            activeMetric={activeMetric}
            onChange={onMetricChange}
          />
        </div>
      </div>

      {/* 📜 Alert History ย้ายมาไว้ด้านล่างสุดแบบเต็มความกว้าง */}
      <div className="mt-10">
        <div className="flex justify-between items-center mb-4 px-2">
          <h3 className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Device Alert History
          </h3>
          <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">
            Recent {alerts.length} Incidents
          </span>
        </div>
        <div className="bg-white dark:bg-[#283046] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50 overflow-hidden">
          <AlertPanel alerts={alerts} />
        </div>
      </div>
    </div>
  );
}