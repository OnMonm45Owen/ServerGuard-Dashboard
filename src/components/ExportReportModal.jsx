// src/components/ExportReportModal.jsx
import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { METRICS_CONFIG } from "../utils/metricsConfig";
import MetricChart from "./MetricChart"; // 💡 ต้องนำเข้าเพื่อแสดงกราฟจริงใน PDF

export default function ExportReportModal({ isOpen, onClose, device, history, alerts, timeRange, activeMetric }) {
  // 💡 State สำหรับเลือกส่วนที่ต้องการแสดงในรายงาน
  const [options, setOptions] = useState({
    summary: true,
    charts: true,
    alerts: true,
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef(null);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsGenerating(true);
    const element = reportRef.current;
    
    try {
      // 💡 ตั้งค่า html2canvas ให้แม่นยำและคมชัด
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794, // ความกว้างมาตรฐาน A4 (96 DPI)
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SG_OFFICIAL_REPORT_${device.id}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-white dark:bg-[#1e293b] border-4 border-slate-900 w-full max-w-5xl max-h-[95vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
        
        {/* 🛠️ Modal Header / Toolbar (ส่วนนี้จะไม่แสดงใน PDF) */}
        <div className="p-6 border-b-2 border-slate-200 flex justify-between items-center bg-white dark:bg-[#1e293b]">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Report Configurator</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select datasets for official documentation</p>
          </div>
          <div className="flex gap-4">
            <button onClick={onClose} className="font-black text-slate-400 hover:text-rose-500 uppercase text-xs transition-colors">Dismiss</button>
            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className={`bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_4px_0_0_#4f46e5] border-2 border-indigo-500 hover:translate-y-1 hover:shadow-[0_2px_0_0_#4f46e5] active:translate-y-2 active:shadow-none transition-all ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isGenerating ? 'Generating...' : 'Download Official PDF'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 dark:bg-[#0f172a]">
          
          {/* ⚙️ Selection Controls (ส่วนเลือกแสดงกราฟหรือประวัติ) */}
          <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'summary', label: 'Summary Box', icon: '📊' },
              { id: 'charts', label: 'Trend Graph', icon: '📈' },
              { id: 'alerts', label: 'Incident Log', icon: '🚨' }
            ].map(item => (
              <label key={item.id} className={`flex items-center justify-between p-5 rounded-2xl cursor-pointer border-2 transition-all ${options[item.id] ? 'bg-white dark:bg-[#1e293b] border-indigo-500 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-transparent opacity-50'}`}>
                <div className="flex items-center gap-4">
                    <input 
                      type="checkbox" 
                      checked={options[item.id]} 
                      onChange={() => setOptions(prev => ({...prev, [item.id]: !prev[item.id]}))}
                      className="w-5 h-5 accent-indigo-600"
                    />
                    <div className="flex flex-col">
                      <span className="font-black text-xs uppercase tracking-widest dark:text-white">{item.label}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase italic">Include in report</span>
                    </div>
                </div>
                <span className="text-xl">{item.icon}</span>
              </label>
            ))}
          </div>

          {/* 📄 REPORT PREVIEW AREA (พื้นที่สำหรับ Render เป็น PDF) */}
          <div 
            ref={reportRef} 
            className="bg-white p-12 text-slate-900 shadow-2xl mx-auto" 
            style={{ width: '210mm', minHeight: '297mm', color: '#000', fontFamily: 'sans-serif' }}
          >
            
            {/* 🏛️ 1. FORMAL HEADER */}
            <div className="border-b-4 border-slate-950 pb-8 mb-10 flex items-center justify-between">
              <div className="flex items-center gap-6 w-1/3 border-r-2 border-slate-100 pr-8">
                <div className="w-16 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg">SG</div>
                <div className="min-w-0">
                  <p className="text-xl font-black uppercase tracking-tighter leading-none">SERVERGUARD</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase italic mt-1">Infrastructure Monitoring</p>
                </div>
              </div>

              <div className="flex-1 text-center px-4">
                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">OFFICIAL STATUS REPORT</h1>
                <div className="mt-2 inline-block bg-slate-100 px-4 py-1 rounded-full">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em]">Confidential Documentation</p>
                </div>
              </div>

              <div className="w-1/4 text-right pl-8 border-l-2 border-slate-100">
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">System Identity</p>
                <p className="font-black text-xl text-indigo-600 uppercase leading-none">{device.id}</p>
                <p className="text-[9px] text-slate-500 mt-2 font-bold uppercase italic">{new Date().toLocaleDateString('th-TH')}</p>
              </div>
            </div>

            {/* 📊 2. SECTION: SYSTEM SNAPSHOT */}
            {options.summary && (
              <div className="mb-10 animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">1.0 สรุปสภาวะแวดล้อมระบบ</h4>
                </div>

                <div className="grid grid-cols-3 border-2 border-slate-900 rounded-3xl overflow-hidden mb-8">
                  <div className="p-5 border-r-2 border-slate-900 bg-slate-50 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Device Designation</p>
                    <p className="font-black text-sm uppercase truncate">{device.name}</p>
                  </div>
                  <div className="p-5 border-r-2 border-slate-900 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Network Interface</p>
                    <p className="font-black text-sm uppercase truncate font-mono">{device.ip_address || '127.0.0.1'}</p>
                  </div>
                  <div className="p-5 bg-slate-50 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Zone / Location</p>
                    <p className="font-black text-sm uppercase truncate">{device.location}</p>
                  </div>
                </div>

                <div className="border-2 border-slate-900 rounded-3xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest">Parameters</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-center">Reading</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-center">Target</th>
                        <th className="p-4 text-[9px] font-black uppercase tracking-widest text-right">Health</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                      {Object.keys(METRICS_CONFIG).map((key) => {
                        const cfg = METRICS_CONFIG[key];
                        const val = history.length > 0 ? history[history.length - 1][key] : 0;
                        const isViolation = val > cfg.threshold || (cfg.thresholdMin && val < cfg.thresholdMin);
                        return (
                          <tr key={key}>
                            <td className="p-4 font-black text-xs uppercase tracking-tighter">{cfg.label}</td>
                            <td className="p-4 text-center font-black text-sm">{val?.toFixed(1)} {cfg.unit}</td>
                            <td className="p-4 text-center text-[10px] font-bold text-slate-400 uppercase italic">Max: {cfg.threshold}{cfg.unit}</td>
                            <td className="p-4 text-right">
                              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${isViolation ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                {isViolation ? '● Critical' : '✓ Normal'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 📈 3. SECTION: TREND VISUALIZER (กราฟจริง) */}
            {options.charts && (
              <div className="mb-10 animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-slate-900 rounded-full"></div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">2.0 บทวิเคราะห์แนวโน้มข้อมูล</h4>
                </div>
                <div className="p-8 border-2 border-slate-900 rounded-[2.5rem] bg-slate-50 h-[380px]">
                  {/* 💡 เรียกใช้กราฟจริง บังคับ darkMode=false เพื่อการพิมพ์ */}
                  <MetricChart 
                    history={history} 
                    activeMetric={activeMetric} 
                    config={METRICS_CONFIG} 
                    timeRange={timeRange} 
                    darkMode={false} 
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-black text-center mt-3 uppercase tracking-widest">
                  Visualized Data Cycle: {timeRange.toUpperCase()} Scope
                </p>
              </div>
            )}

            {/* 🚨 4. SECTION: INCIDENT LOG (ประวัติแจ้งเตือน) */}
            {options.alerts && (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-rose-600 rounded-full"></div>
                  <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest">3.0 ประวัติเหตุการณ์ผิดปกติ</h4>
                </div>
                <div className="border-2 border-slate-900 rounded-3xl overflow-hidden">
                  <table className="w-full text-left text-[10px]">
                    <thead>
                      <tr className="bg-rose-600 text-white font-black uppercase tracking-widest">
                        <th className="p-4">Timestamp (UTC+7)</th>
                        <th className="p-4 text-center">Trigger Metric</th>
                        <th className="p-4 text-right">Protocol Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100">
                      {alerts.length > 0 ? alerts.slice(0, 12).map((a, i) => (
                        <tr key={i}>
                          <td className="p-4 font-bold text-slate-500">{new Date(a.time).toLocaleString('th-TH')}</td>
                          <td className="p-4 text-center font-black uppercase text-slate-900">{a.metric} Alert</td>
                          <td className="p-4 text-right">
                             <span className="text-[9px] font-black text-rose-600 border border-rose-200 px-3 py-1 rounded-full uppercase">Incident Recorded</span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="3" className="p-20 text-center font-black text-slate-300 uppercase tracking-widest">No Critical Incidents Detected</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 📝 FOOTER / SIGNATURE */}
            <div className="mt-auto pt-10 border-t-2 border-slate-100 flex justify-between items-end">
              <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">
                Authentic Infrastructure Report • System identity: {device.id}
              </div>
              <div className="text-right">
                <div className="w-48 h-[1px] bg-slate-950 mb-2 ml-auto"></div>
                <p className="text-[10px] font-black uppercase text-slate-950">System Authorized Signature</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Automated Performance Verification</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}