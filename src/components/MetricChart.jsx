import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import 'chartjs-adapter-date-fns'; 
import { th } from 'date-fns/locale'; 

Chart.register(zoomPlugin);

export default function MetricChart({ history, activeMetric, config, darkMode, timeRange }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // 💡 ฟังก์ชันหาค่าเฉลี่ย และเช็ค Alert (รองรับข้อมูลสรุป)
  const aggregateData = (data, pointsPerDay, cfg) => {
    if (!data || data.length === 0) return [];
    const intervalMs = (24 * 60 * 60 * 1000) / pointsPerDay;
    const groups = {};

    data.forEach(item => {
      const time = new Date(item.x).getTime();
      const groupKey = Math.floor(time / intervalMs) * intervalMs;
      
      if (!groups[groupKey]) {
        groups[groupKey] = { sum: 0, count: 0, hasAlert: false };
      }
      
      groups[groupKey].sum += item.y;
      groups[groupKey].count += 1;
      
      // ถ้ามีจุดใดจุดหนึ่งในกลุ่มเกินเกณฑ์ ให้ Flag ว่ามี Alert
      if (item.y > cfg.threshold || (cfg.thresholdMin && item.y < cfg.thresholdMin)) {
        groups[groupKey].hasAlert = true;
      }
    });

    return Object.keys(groups).map(key => ({
      x: new Date(parseInt(key)),
      y: Number((groups[key].sum / groups[key].count).toFixed(2)),
      isAlert: groups[key].hasAlert
    })).sort((a, b) => a.x - b.x);
  };

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext("2d");
    const cfg = config[activeMetric];
    
    // ป้องกัน Error หากหา Config ไม่เจอ
    if (!cfg) return;

    const baseColor = cfg?.color || "#3b82f6";

    // 1. ข้อมูลแบบละเอียด
    const detailedData = history.map(log => ({
      x: new Date(log.created_at),
      y: log[activeMetric],
      isAlert: log[activeMetric] > cfg.threshold || (cfg.thresholdMin && log[activeMetric] < cfg.thresholdMin)
    })).sort((a, b) => a.x - b.x);

    // 2. ข้อมูลแบบสรุปตามเงื่อนไข (7 วัน / 30 วัน)
    let aggregatedData = detailedData;
    let thresholdHours = 0; 

    if (timeRange === '7d') {
      aggregatedData = aggregateData(detailedData, 8, cfg);
      thresholdHours = 24; 
    } else if (timeRange === '30d') {
      aggregatedData = aggregateData(detailedData, 4, cfg);
      thresholdHours = 72; 
    }

    // 💡 3. ข้อมูลสำหรับเส้น Limit (แนวนอน)
    const limitData = aggregatedData.length > 0 ? [
      { x: aggregatedData[0].x, y: cfg.threshold },
      { x: aggregatedData[aggregatedData.length - 1].x, y: cfg.threshold }
    ] : [];

    const themeColors = {
      grid: darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      text: darkMode ? "#cbd5e1" : "#1e293b",
      tooltipBg: darkMode ? "#0f172a" : "#1e293b",
    };

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, darkMode ? `${baseColor}44` : `${baseColor}66`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: `${cfg?.label} (${cfg?.unit})`,
            data: aggregatedData,
            borderColor: baseColor,
            backgroundColor: gradient,
            fill: true,
            tension: 0.3,
            borderWidth: 3, // เส้นหนาชัดเจน
            pointRadius: (ctx) => (ctx.raw?.isAlert ? 6 : 0),
            pointHoverRadius: 8,
            pointBackgroundColor: "#ef4444",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            zIndex: 2
          },
          {
            label: `Limit (${cfg.threshold}${cfg.unit})`,
            data: limitData,
            borderColor: "#ef4444",
            borderWidth: 2,
            borderDash: [6, 6], // เส้นประ
            pointRadius: 0,
            fill: false,
            zIndex: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: {
              color: themeColors.text,
              font: { weight: '900', size: 11 },
              usePointStyle: true,
              boxWidth: 8
            }
          },
          zoom: {
            pan: { enabled: true, mode: "x" },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: "x",
              onZoomComplete: ({ chart }) => {
                const { min, max } = chart.scales.x;
                const visibleHours = (max - min) / (1000 * 60 * 60);
                
                const targetData = (timeRange !== '24h' && visibleHours < thresholdHours) 
                  ? detailedData 
                  : aggregatedData;

                if (chart.data.datasets[0].data !== targetData) {
                  chart.data.datasets[0].data = targetData;
                  // อัปเดตเส้น Limit ให้ยาวตามข้อมูลที่เปลี่ยน
                  chart.data.datasets[1].data = [
                    { x: targetData[0].x, y: cfg.threshold },
                    { x: targetData[targetData.length - 1].x, y: cfg.threshold }
                  ];
                  chart.update('none');
                }
              }
            }
          },
          tooltip: {
            backgroundColor: themeColors.tooltipBg,
            titleFont: { weight: 'bold' },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              title: (items) => new Date(items[0].raw.x).toLocaleString('en-GB', {
                hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', hour12: false
              }),
              label: (context) => ` ${context.dataset.label}: ${context.raw.y}`
            }
          }
        },
        scales: {
          x: {
            type: "time",
            adapters: { date: { locale: th } },
            grid: { display: false },
            ticks: {
              color: themeColors.text,
              font: { weight: 'bold', size: 10 },
              autoSkip: true,
              maxRotation: 0,
              callback: function(value) {
                const d = new Date(value);
                if (timeRange === '24h') return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
                return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
              }
            }
          },
          y: { 
            grid: { color: themeColors.grid, borderDash: [3, 3] }, 
            ticks: { 
              color: themeColors.text,
              font: { weight: 'bold' } 
            } 
          }
        },
        interaction: { intersect: false, mode: "index" }
      }
    });

    return () => chartInstance.current?.destroy();
  }, [history, activeMetric, config, darkMode, timeRange]);

  return (
    <div className="relative w-full h-full group bg-slate-50/50 dark:bg-transparent rounded-2xl p-2 border-2 border-transparent">
      <canvas ref={chartRef}></canvas>
      <button
        onClick={() => {
          chartInstance.current?.resetZoom();
          chartInstance.current.update();
        }}
        className="absolute top-10 right-4 opacity-0 group-hover:opacity-100 bg-slate-900 dark:bg-indigo-600 text-white text-[10px] font-black py-2 px-4 rounded-xl shadow-xl transition-all z-10 hover:scale-110 active:scale-95 border-2 border-white/20 uppercase"
      >
        🔄 Reset View
      </button>
    </div>
  );
}