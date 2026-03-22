// src/components/ExportReportModal.jsx
import React, { useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import MetricChart from "./MetricChart";
import TimeRangeSelector from "./TimeRangeSelector"; // 💡 นำเข้าเมนูเลือกเวลา
import useSensorData from "../hooks/useSensorData"; // 💡 นำเข้า Hook เพื่อดึงข้อมูลเฉพาะสำหรับรายงาน

export default function ExportReportModal({ 
  isOpen, 
  onClose, 
  device, 
  config, 
  timeRange: initialTimeRange, // รับค่าเริ่มต้นจากหน้าแดชบอร์ด
  selectedDate: initialDate 
}) {
  
  // --- 1. State สำหรับกำหนดเวลาของรายงาน (แยกอิสระจากหน้าหลัก) ---
  const [timeRange, setTimeRange] = useState(initialTimeRange || "24h");
  const [selectedDate, setSelectedDate] = useState(initialDate || "");

  // ซิงค์เวลาเริ่มต้นให้ตรงกับหน้าแดชบอร์ดตอนกดเปิด Modal
  useEffect(() => {
    if (isOpen) {
      setTimeRange(initialTimeRange || "24h");
      setSelectedDate(initialDate || "");
    }
  }, [isOpen, initialTimeRange, initialDate]);

  // --- 2. ดึงข้อมูลประวัติและแจ้งเตือนใหม่ ตามเวลาที่เลือกใน Modal ---
  // (ใส่เงื่อนไข isOpen เพื่อไม่ให้มันดึงข้อมูลฟรีๆ ตอนปิด Modal ทิ้งไว้)
  const { history, alerts } = useSensorData(isOpen ? device?.id : null, selectedDate, timeRange, config);

  // --- 3. State สำหรับตั้งค่ารายงาน ---
  const [options, setOptions] = useState({ summary: true, charts: true, alerts: true });
  
  const availableMetrics = Object.keys(config || {}).filter(key => !config[key].is_multi_line && key !== 'ping');
  const [selectedGraphMetrics, setSelectedGraphMetrics] = useState(availableMetrics);
  const [tableMode, setTableMode] = useState('all'); 
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen || !config) return null;

  const toggleGraphMetric = (key) => {
    setSelectedGraphMetrics(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 15;

      // --- HEADER ---
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("SERVERGUARD PRO - OFFICIAL STATUS REPORT", 14, currentY);
      
      currentY += 10;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Device ID: ${device.id}`, 14, currentY);
      doc.text(`Export Date: ${new Date().toLocaleString('th-TH')}`, pageWidth - 14, currentY, { align: "right" });
      currentY += 6;
      doc.text(`Device Name: ${device.name}`, 14, currentY);
      doc.text(`Data Scope: ${timeRange.toUpperCase()} ${selectedDate ? `(${selectedDate})` : '(Latest)'}`, pageWidth - 14, currentY, { align: "right" });
      currentY += 6;
      doc.text(`Location/Zone: ${device.location}`, 14, currentY);
      currentY += 15;

      const metricsForTable = tableMode === 'all' ? availableMetrics : selectedGraphMetrics;

      // --- SUMMARY TABLE ---
      if (options.summary && metricsForTable.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("1.0 SYSTEM SNAPSHOT", 14, currentY);
        currentY += 5;

        const summaryData = metricsForTable.map(key => {
          const cfg = config[key];
          const val = history.length > 0 ? history[history.length - 1][key] : null;
          const isViolation = val !== null && (val > cfg.threshold || (cfg.threshold_min !== null && val < cfg.threshold_min));
          return [
            cfg.label,
            val !== null ? `${(Math.abs(val) > 0 && Math.abs(val) < 1 ? parseFloat(val).toFixed(4) : parseFloat(val).toFixed(1))} ${cfg.unit}` : 'N/A',
            `Max: ${cfg.threshold || '-'} / Min: ${cfg.threshold_min !== null ? cfg.threshold_min : '-'}`,
            isViolation ? 'Critical' : 'Normal'
          ];
        });

        autoTable(doc, {
          startY: currentY,
          head: [['Parameter', 'Current Reading', 'Target Limits', 'Health Status']],
          body: summaryData,
          theme: 'grid',
          headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
          didDrawPage: (data) => { currentY = data.cursor.y; }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      // --- TREND GRAPH ---
      if (options.charts && selectedGraphMetrics.length > 0) {
        if (currentY > 230) { doc.addPage(); currentY = 20; }
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("2.0 DATA TREND ANALYSIS", 14, currentY);
        currentY += 10;

        for (const key of selectedGraphMetrics) {
          if (currentY > 180) { doc.addPage(); currentY = 20; }
          const chartElement = document.getElementById(`pdf-chart-${key}`);
          if (chartElement) {
            const canvas = await html2canvas(chartElement, { scale: 2, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL("image/png");
            const imgWidth = pageWidth - 28;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(`Metric: ${config[key]?.label}`, 14, currentY);
            currentY += 4;
            doc.addImage(imgData, "PNG", 14, currentY, imgWidth, imgHeight);
            currentY += imgHeight + 12; 
          }
        }
      }

      // --- INCIDENT LOG ---
      if (options.alerts) {
        if (currentY > 250) { doc.addPage(); currentY = 20; }
        const filteredAlerts = alerts.filter(a => metricsForTable.includes(a.metric) || a.metric === 'status');
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`3.0 INCIDENT PROTOCOL HISTORY (${filteredAlerts.length} Events)`, 14, currentY);
        currentY += 5;

        const alertsData = filteredAlerts.map(a => [
          new Date(a.time).toLocaleString('th-TH'),
          config[a.metric]?.label || a.metric,
          a.value ? (Math.abs(a.value) > 0 && Math.abs(a.value) < 1 ? parseFloat(a.value).toFixed(4) : parseFloat(a.value).toFixed(1)) : 'N/A',
          a.metric === 'status' ? 'System Offline' : 'Threshold Exceeded'
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Timestamp (UTC+7)', 'Trigger Metric', 'Recorded Value', 'Incident Reason']],
          body: alertsData.length > 0 ? alertsData : [['No incidents detected in the selected scope', '', '', '']],
          theme: 'striped',
          headStyles: { fillColor: [225, 29, 72], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' }, 
        });
      }

      doc.save(`SG_REPORT_${device.id}_${timeRange}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative bg-white dark:bg-[#1e293b] border-4 border-slate-900 w-full max-w-4xl max-h-[95vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-300">
        
        {/* Modal Header */}
        <div className="p-6 border-b-2 border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-[#1e293b]">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Export Report</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configure PDF Data & Parameters</p>
          </div>
          <button onClick={onClose} className="font-black text-slate-400 hover:text-rose-500 uppercase text-xs transition-colors">✕ Dismiss</button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-[#0f172a] flex flex-col gap-8">
          
          {/* 🗓️ ส่วนเลือกเวลาสำหรับรายงานโดยเฉพาะ */}
          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] border-2 border-slate-200 dark:border-slate-700 shadow-sm">
            <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-widest mb-4">
              1. Report Period (Data Scope)
            </h4>
            <div className="overflow-x-auto pb-2">
              <TimeRangeSelector 
                timeRange={timeRange} 
                setTimeRange={setTimeRange} 
                selectedDate={selectedDate} 
                setSelectedDate={setSelectedDate} 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ซีกซ้าย: เลือกหัวข้อหลัก & โหมดตาราง */}
            <div>
              <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-widest mb-4">2. Select Sections</h4>
              <div className="flex flex-col gap-3">
                {[
                  { id: 'summary', label: 'System Snapshot (Summary)', icon: '📊' },
                  { id: 'charts', label: 'Trend Graph Visualization', icon: '📈' },
                  { id: 'alerts', label: 'Incident & Alert Logs', icon: '🚨' }
                ].map(item => (
                  <label key={item.id} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border-2 transition-all ${options[item.id] ? 'bg-white dark:bg-[#1e293b] border-indigo-500 shadow-sm' : 'bg-transparent border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'}`}>
                    <div className="flex items-center gap-4">
                      <input type="checkbox" checked={options[item.id]} onChange={() => setOptions(prev => ({...prev, [item.id]: !prev[item.id]}))} className="w-5 h-5 accent-indigo-600" />
                      <span className="font-black text-xs uppercase tracking-widest dark:text-white">{item.label}</span>
                    </div>
                    <span className="text-lg">{item.icon}</span>
                  </label>
                ))}
              </div>

              {/* โหมดตารางเชื่อมโยงกับกราฟ */}
              <div className="mt-6 p-5 border-2 border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-[#1e293b]">
                <h5 className="text-[10px] font-black uppercase text-slate-500 mb-4 tracking-widest">Table & Alert Scope</h5>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" checked={tableMode === 'all'} onChange={() => setTableMode('all')} className="w-4 h-4 accent-indigo-600" />
                    <span className="text-xs font-bold dark:text-white">Show ALL Metrics</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" checked={tableMode === 'linked'} onChange={() => setTableMode('linked')} className="w-4 h-4 accent-indigo-600" />
                    <span className="text-xs font-bold dark:text-white">Show ONLY Graph Metrics</span>
                  </label>
                </div>
              </div>
            </div>

            {/* ซีกขวา: เลือกกราฟ */}
            <div>
              <div className="flex justify-between items-end mb-4">
                <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-widest">3. Select Graphs</h4>
                <button onClick={() => setSelectedGraphMetrics(selectedGraphMetrics.length === availableMetrics.length ? [] : availableMetrics)} className="text-[10px] font-black text-indigo-500 uppercase hover:underline">
                  {selectedGraphMetrics.length === availableMetrics.length ? "Deselect All" : "Select All"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {availableMetrics.map(key => (
                  <label key={key} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all ${selectedGraphMetrics.includes(key) ? 'bg-white dark:bg-[#1e293b] border-emerald-500 shadow-sm' : 'bg-transparent border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100'}`}>
                    <input type="checkbox" checked={selectedGraphMetrics.includes(key)} onChange={() => toggleGraphMetric(key)} className="w-4 h-4 accent-emerald-600" />
                    <span className="font-black text-[10px] uppercase tracking-widest dark:text-white truncate">{config[key].label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* กราฟที่ซ่อนไว้เพื่อถ่ายภาพลง PDF */}
        {options.charts && (
          <div className="absolute opacity-0 pointer-events-none" style={{ left: '-9999px', top: '-9999px' }}>
            {selectedGraphMetrics.map(key => (
              <div key={`capture-${key}`} id={`pdf-chart-${key}`} className="w-[800px] h-[350px] bg-white p-6">
                <MetricChart history={history} activeMetric={key} config={config} timeRange={timeRange} darkMode={false} />
              </div>
            ))}
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-6 border-t-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e293b] flex justify-between items-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase">
            *Independent Scope: Changing dates here will not affect your main dashboard.
          </p>
          <button 
            onClick={handleDownload}
            disabled={isGenerating || (options.summary === false && options.charts === false && options.alerts === false) || (options.charts && selectedGraphMetrics.length === 0)}
            className={`bg-slate-900 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-[0_4px_0_0_#4f46e5] border-2 border-indigo-500 hover:translate-y-1 hover:shadow-[0_2px_0_0_#4f46e5] active:translate-y-2 active:shadow-none
              ${(isGenerating || (options.charts && selectedGraphMetrics.length === 0)) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isGenerating ? 'Fetching Data & Generating PDF...' : 'Download Official PDF'}
          </button>
        </div>

      </div>
    </div>
  );
}