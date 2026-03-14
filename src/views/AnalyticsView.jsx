// src/views/AnalyticsView.jsx
import React, { useState } from "react";
import MetricChart from "../components/MetricChart";
import MetricSelector from "../components/MetricSelector";
import TimeRangeSelector from "../components/TimeRangeSelector";
import AlertPanel from "../components/AlertPanel";
import ExportReportModal from "../components/ExportReportModal";
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
    // 💡 สถานะเปิด/ปิด Modal รายงาน
    const [isExportOpen, setIsExportOpen] = useState(false);

    // ตรวจสอบว่าเป็นโหมด 1 ชั่วโมงหรือไม่ เพื่อแสดงป้าย Live
    const isLiveMode = timeRange === "1h" && (!selectedDate || new Date(selectedDate).toDateString() === new Date().toDateString());

    return (
        <div className="p-6 max-w-7xl mx-auto animate-in fade-in zoom-in duration-500 pb-20">
            
            {/* 🔙 Navigation & Actions Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack} 
                        className="flex items-center justify-center w-12 h-12 bg-white dark:bg-[#1e293b] border-2 border-slate-900 dark:border-slate-700 rounded-2xl shadow-[0_4px_0_0_#000] active:translate-y-1 active:shadow-none transition-all group"
                    >
                        <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                    </button>
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate max-w-[250px] md:max-w-full leading-none mb-1">
                            {device.name}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded">ID: {device.id}</span>
                            <span className="text-slate-500 font-bold text-xs uppercase tracking-widest italic">{device.location}</span>
                        </div>
                    </div>
                </div>

                {/* 📄 ปุ่มกดเพื่อออกรายงาน PDF - ปรับปรุงสไตล์ให้ดูพรีเมียม */}
                <button 
                    onClick={() => setIsExportOpen(true)}
                    className="
                        bg-slate-900 text-white px-8 py-4 rounded-2xl 
                        font-black text-xs uppercase tracking-widest 
                        shadow-[0_6px_0_0_#4f46e5] border-2 border-indigo-500 
                        hover:translate-y-1 hover:shadow-[0_2px_0_0_#4f46e5] 
                        active:translate-y-2 active:shadow-none 
                        transition-all flex items-center gap-3
                    "
                >
                    <span className="text-lg">📄</span> Generate Official Report
                </button>
            </div>

            {/* 🛠️ Control Bar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div className="p-2 bg-slate-100 dark:bg-[#0f172a] rounded-[1.5rem] border-2 border-slate-900 dark:border-slate-700 shadow-inner w-full lg:w-auto overflow-x-auto">
                    <TimeRangeSelector 
                        timeRange={timeRange} 
                        setTimeRange={setTimeRange} 
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                    />
                </div>

                {isLiveMode && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border-2 border-emerald-500 rounded-xl animate-pulse">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest">Live Monitoring Active</span>
                    </div>
                )}
            </div>

            {/* 📊 Main Visualization Card */}
            <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] border-2 border-slate-900 dark:border-slate-700 p-8 mb-10 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-100 dark:border-slate-800">
                             {activeMetric === 'ping' ? '📡' : '⚡'}
                        </div>
                        <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Current Metric</span>
                            <h3 className="font-black text-slate-900 dark:text-white uppercase text-xl leading-none">
                                {METRICS_CONFIG[activeMetric]?.label}
                            </h3>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6 bg-slate-50 dark:bg-[#0f172a] px-6 py-3 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
                        <div className="text-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase block">Samples</span>
                            <span className="text-lg font-black text-slate-900 dark:text-white">{history?.length || 0}</span>
                        </div>
                        <div className="w-[2px] h-8 bg-slate-200 dark:bg-slate-700"></div>
                        <div className="text-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase block">Unit</span>
                            <span className="text-lg font-black text-indigo-500">{METRICS_CONFIG[activeMetric]?.unit}</span>
                        </div>
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

            {/* 🔘 Metric Selector */}
            <div className="mb-16">
                <MetricSelector activeMetric={activeMetric} onMetricChange={onMetricChange} />
            </div>

            {/* 📜 Incident Log */}
            <div className="bg-slate-900 dark:bg-[#0f172a] rounded-[2.5rem] p-8 border-2 border-slate-800 shadow-2xl">
                <div className="flex justify-between items-center mb-8 px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-rose-500 rounded-full animate-bounce"></div>
                        <h3 className="text-xl font-black text-white uppercase tracking-tighter">Incident Protocol History</h3>
                    </div>
                    <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/30">
                        {alerts?.length || 0} TOTAL INCIDENTS
                    </span>
                </div>
                <div className="bg-white dark:bg-[#1e293b]/50 rounded-2xl border-2 border-slate-800 overflow-hidden">
                    <AlertPanel alerts={alerts} />
                </div>
            </div>

            {/* 💡 เรียกใช้ ExportReportModal พร้อมส่ง activeMetric เข้าไป */}
            <ExportReportModal 
                isOpen={isExportOpen} 
                onClose={() => setIsExportOpen(false)} 
                device={device}
                history={history}
                alerts={alerts}
                timeRange={timeRange}
                activeMetric={activeMetric} // 👈 สำคัญ: เพื่อให้กราฟใน PDF แสดงข้อมูลที่ถูกต้อง
            />
        </div>
    );
}

export default AnalyticsView;