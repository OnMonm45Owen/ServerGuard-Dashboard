import React from "react";
import MetricChart from "../components/MetricChart";
import MetricSelector from "../components/MetricSelector";
import TimeRangeSelector from "../components/TimeRangeSelector";
import AlertPanel from "../components/AlertPanel";
import { METRICS_CONFIG } from "../utils/metricsConfig";

const AnalyticsView = ({
  device,
  history,
  activeMetric,    // รับค่าจาก App (คือ metric)
  onMetricChange,  // รับฟังก์ชันจาก App (คือ setMetric)
  timeRange,       // รับค่าจาก App
  setTimeRange,    // รับฟังก์ชันจาก App
  selectedDate,
  setSelectedDate,
  alerts,          // รับแจ้งเตือนเฉพาะอุปกรณ์
  onBack,
  darkMode
  
}) => {
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
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">Real-time Performance Analysis</p>
        </div>
        
        {/* แก้ไข: ส่วนควบคุมช่วงเวลา */}
        <div className="flex flex-wrap gap-3">
          <TimeRangeSelector 
            timeRange={timeRange} 
            setTimeRange={setTimeRange} 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>
      </div>

      {/* 📊 ส่วนแสดงผลกราฟ */}
      <div className="bg-white dark:bg-[#283046] rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700/50 p-6 mb-8 transition-colors">
        <div className="flex justify-center items-center mb-6">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#161D31] px-4 py-2 rounded-full border border-slate-100 dark:border-slate-700">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: METRICS_CONFIG[activeMetric]?.color }}></div>
            <span className="font-bold text-slate-700 dark:text-[#D0D2D6] uppercase tracking-widest text-[10px]">
              {METRICS_CONFIG[activeMetric]?.label} Monitoring
            </span>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          <MetricChart
            history={history}
            activeMetric={activeMetric}
            config={METRICS_CONFIG}
            timeRange={timeRange}
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* 🔘 Select Metric ส่วนเลือกตัวแปรที่ต้องการดู */}
      <div className="flex flex-col items-center mb-12">
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4">
          Select Analysis Metric
        </h3>
        <div className="flex flex-wrap justify-center gap-4 w-full">
          {/* แก้ไข: ตรวจสอบให้แน่ใจว่าใช้ onMetricChange ตามชื่อที่รับมาจาก Props */}
          <MetricSelector
            activeMetric={activeMetric}
            onMetricChange={onMetricChange}
          />
        </div>
      </div>

      {/* 📜 Alert History ประวัติการแจ้งเตือน */}
      <div className="mt-10 border-t border-slate-200 dark:border-slate-800 pt-10">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Device Alert History
          </h3>
          <span className="text-[10px] font-bold text-blue-600 dark:text-indigo-400 bg-blue-50 dark:bg-indigo-500/10 px-3 py-1 rounded-full border border-blue-100 dark:border-indigo-500/20">
            Recent {alerts?.length || 0} Incidents
          </span>
        </div>
        <div className="overflow-hidden">
          <AlertPanel alerts={alerts} />
        </div>
      </div>
    </div>
  );
}

export default AnalyticsView;