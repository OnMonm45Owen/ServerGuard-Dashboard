import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import 'chartjs-adapter-date-fns'; // 💡 สำหรับจัดการแกนเวลาจริง
import { th } from 'date-fns/locale'; // 💡 สำหรับแสดงผลภาษาไทย

Chart.register(zoomPlugin);

export default function MetricChart({ history, activeMetric, config, range, darkMode }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext("2d");
    const cfg = config[activeMetric];

    // 💡 เตรียมข้อมูล: ใช้ Date Object จริงเพื่อให้ซูมได้ลึกถึงระดับวินาที
    const chartData = history
      .map((log) => ({
        x: new Date(log.created_at),
        y: log[activeMetric],
        isAlert: log[activeMetric] > cfg.threshold
      }))
      .sort((a, b) => a.x - b.x);

    const thresholdData = chartData.map((d) => ({ x: d.x, y: cfg.threshold }));

    // ตั้งค่าสีตามโหมด (Icewall Theme)
    const themeColors = {
      grid: darkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.08)",
      text: darkMode ? "#94a3b8" : "#64748b",
      tooltipBg: darkMode ? "#1e293b" : "#0f172a",
    };

    // สร้าง Gradient พื้นหลังกราฟ
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, darkMode ? "rgba(99, 102, 241, 0.2)" : "rgba(59, 130, 246, 0.3)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        datasets: [
          {
            label: cfg.label,
            data: chartData,
            borderColor: cfg.color,
            backgroundColor: gradient,
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            // 💡 แสดงจุดเฉพาะตอนที่มี Alert หรือเมื่อซูมเข้าไปลึกๆ
            pointRadius: chartData.map(d => d.isAlert ? 6 : 0),
            pointHoverRadius: 8,
            pointBackgroundColor: chartData.map(d => d.isAlert ? "#ef4444" : "#fff"),
            pointBorderColor: chartData.map(d => d.isAlert ? "#fff" : cfg.color),
            pointBorderWidth: 2,
            order: 2
          },
          {
            label: "Limit",
            data: thresholdData,
            borderColor: "#ef4444",
            borderDash: [5, 5],
            borderWidth: 1.5,
            pointRadius: 0,
            fill: false,
            order: 1
          }
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // ปิดเพื่อความลื่นไหลในการซูม
        plugins: {
          legend: { display: false },
          zoom: {
            pan: { enabled: true, mode: "x", threshold: 10 },
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              mode: "x",
              drag: { enabled: true, backgroundColor: 'rgba(59, 130, 246, 0.1)' }
            }
          },
          tooltip: {
            backgroundColor: themeColors.tooltipBg,
            titleFont: { size: 13, weight: 'bold' },
            padding: 12,
            cornerRadius: 10,
            callbacks: {
              title: (items) => {
                const date = new Date(items[0].raw.x);
                // 💡 แสดงวินาทีใน Tooltip เมื่อเอาเมาส์ชี้
                return date.toLocaleString('th-TH', { 
                  hour: '2-digit', minute: '2-digit', second: '2-digit',
                  day: 'numeric', month: 'short', year: '2-digit'
                }) + " น.";
              },
              label: (context) => ` ${context.raw.y} ${cfg.unit}`
            }
          }
        },
        scales: {
          x: {
            type: "time",
            adapters: {
              date: { locale: th } // 💡 แสดงผลภาษาไทย
            },
            time: {
              displayFormats: {
                second: 'HH:mm:ss', // 💡 แกน X จะโชว์วินาทีเมื่อซูมเข้าไปลึกพอ
                minute: 'HH:mm',
                hour: 'HH:mm',
                day: 'd MMM'
              }
            },
            grid: { 
              display: true, 
              color: themeColors.grid 
            },
            ticks: {
              color: themeColors.text,
              maxRotation: 0,
              autoSkip: true,
              font: { size: 10 }
            }
          },
          y: {
            suggestedMax: cfg.threshold * 1.2,
            grid: { color: themeColors.grid, borderDash: [4, 4] },
            ticks: { color: themeColors.text, padding: 10 }
          }
        },
        interaction: { intersect: false, mode: "index" }
      }
    });

    return () => chartInstance.current?.destroy();
  }, [history, activeMetric, config, range, darkMode]);

  return (
    <div className="relative w-full h-full group">
      <canvas ref={chartRef}></canvas>
      {/* ปุ่ม Reset Zoom เมื่อซูมไปไกลแล้วอยากกลับมาดูภาพรวม */}
      <button 
        onClick={() => chartInstance.current?.resetZoom()}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-white/10 backdrop-blur-md text-[10px] font-bold py-1 px-3 rounded-lg border border-white/20 text-slate-400 hover:text-white transition-all z-10"
      >
        🔄 Reset Zoom
      </button>
    </div>
  );
}