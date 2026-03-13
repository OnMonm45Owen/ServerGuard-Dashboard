import React from "react";
import MetricChart from "../components/MetricChart";
import MetricSelector from "../components/MetricSelector";
import TimeRangeSelector from "../components/TimeRangeSelector";
import AlertPanel from "../components/AlertPanel";
import { METRICS_CONFIG } from "../utils/metricsConfig";

const AnalyticsView = ({
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
}) => {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
      {/* 🔙 ปุ่มย้อนกลับ - ปรับให้ตัวหนาและสีเข้มชัดเจน */}
      <button 
        onClick={onBack} 
        className="mb-8 flex items-center gap-2 text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-indigo-400 font-black transition-all group px-4 py-2 bg-white dark:bg-[#1e293b] border-2 border-slate-300 dark:border-slate-600 rounded-xl shadow-sm"
      >
        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span> 
        BACK TO DASHBOARD
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          {/* 💡 ชื่ออุปกรณ์: ปรับเป็น text-4xl และ font-black เพื่อให้เด่นที่สุด */}
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {device.name}
          </h2>
          <div className="flex items-center gap-2">
             <span className="px-2 py-0.5 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black rounded">DEVICE ID: {device.id}</span>
             <p className="text-slate-600 dark:text-slate-300 font-bold">Real-time Performance Analysis</p>
          </div>
        </div>
        
        {/* 💡 ส่วนควบคุมช่วงเวลา: เพิ่มกรอบล้อมรอบให้ชัดเจน */}
        <div className="p-2 bg-slate-100 dark:bg-[#0f172a] rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-inner">
          <TimeRangeSelector 
            timeRange={timeRange} 
            setTimeRange={setTimeRange} 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>
      </div>

      {/* 📊 ส่วนแสดงผลกราฟ - ปรับเป็น border-2 และเพิ่ม padding */}
      <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-xl border-2 border-slate-300 dark:border-slate-600 p-8 mb-12 transition-colors">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3 bg-slate-900 dark:bg-[#0f172a] px-5 py-2.5 rounded-xl border-2 border-slate-800 dark:border-slate-500">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: METRICS_CONFIG[activeMetric]?.color }}></div>
            <span className="font-black text-white uppercase tracking-[0.2em] text-xs">
              {METRICS_CONFIG[activeMetric]?.label} MONITORING
            </span>
          </div>
          
          <div className="hidden sm:block text-right">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase block">Data Points</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">{history?.length || 0}</span>
          </div>
        </div>
        
        <div className="h-[450px] w-full">
          <MetricChart
            history={history}
            activeMetric={activeMetric}
            config={METRICS_CONFIG}
            timeRange={timeRange}
            darkMode={darkMode}
          />
        </div>
      </div>

      {/* 🔘 Select Metric - ปรับป้ายกำกับให้ชัดขึ้น */}
      <div className="flex flex-col items-center mb-16">
        <div className="flex items-center gap-4 w-full mb-6">
          <div className="h-[2px] flex-grow bg-slate-300 dark:bg-slate-700"></div>
          <h3 className="text-xs font-black text-slate-900 dark:text-slate-400 uppercase tracking-[0.4em] whitespace-nowrap">
            SELECT ANALYSIS METRIC
          </h3>
          <div className="h-[2px] flex-grow bg-slate-300 dark:bg-slate-700"></div>
        </div>
        
        <div className="w-full">
          <MetricSelector
            activeMetric={activeMetric}
            onMetricChange={onMetricChange}
          />
        </div>
      </div>

      {/* 📜 Alert History - เพิ่มเส้นขอบหนาและสีตัวอักษรที่ตัดกัน */}
      <div className="mt-10 bg-slate-50 dark:bg-[#0f172a] rounded-3xl border-2 border-slate-300 dark:border-slate-700 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="w-2 h-8 bg-rose-500 rounded-full"></div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              DEVICE ALERT HISTORY
            </h3>
          </div>
          <span className="text-xs font-black text-white bg-rose-600 px-4 py-1.5 rounded-full shadow-lg shadow-rose-500/20">
            {alerts?.length || 0} INCIDENTS
          </span>
        </div>
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <AlertPanel alerts={alerts} />
        </div>
      </div>
    </div>
  );
}

export default AnalyticsView;