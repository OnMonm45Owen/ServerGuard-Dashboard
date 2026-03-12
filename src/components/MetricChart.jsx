import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import 'chartjs-adapter-date-fns'; 
import { th } from 'date-fns/locale'; 

Chart.register(zoomPlugin);

export default function MetricChart({ history, activeMetric, config, darkMode, timeRange }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext("2d");
    const cfg = config[activeMetric];

    // ตั้งค่าสีตามโหมด (ปรับให้ Contrast ต่ำลงเพื่อถนอมสายตา)
    const themeColors = {
      grid: darkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
      text: darkMode ? "#94a3b8" : "#64748b",
      tooltipBg: darkMode ? "#161D31" : "#1e293b",
      tooltipBorder: darkMode ? "#3b4353" : "#e2e8f0"
    };

    // 💡 ฟังก์ชันเลือกรูปแบบเวลาใต้กราฟแยกตามช่วงเวลา
    const getDisplayFormat = () => {
      if (timeRange === '24h') {
        return {
          hour: 'HH:mm',     // เช่น 13:25
          minute: 'HH:mm',
          second: 'HH:mm:ss'
        };
      } else if (timeRange === '7d') {
        return {
          day: 'eee HH:mm',  // เช่น จ. 10:00
          hour: 'eee HH:mm'
        };
      } else { // 30d
        return {
          day: 'd MMM',      // เช่น 13 มี.ค.
          month: 'd MMM'
        };
      }
    };

    // สร้าง Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    const baseColor = cfg?.color || "#3b82f6";
    gradient.addColorStop(0, darkMode ? `${baseColor}33` : `${baseColor}4D`);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    const chartData = history
      .map((log) => ({
        x: new Date(log.created_at),
        y: log[activeMetric],
        isAlert: log[activeMetric] > cfg?.threshold || (cfg?.thresholdMin && log[activeMetric] < cfg?.thresholdMin)
      }))
      .sort((a, b) => a.x - b.x);

    const datasets = [
      {
        label: cfg?.label,
        data: chartData,
        borderColor: baseColor,
        backgroundColor: gradient,
        fill: true,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: chartData.map(d => d.isAlert ? 5 : 0),
        pointHoverRadius: 7,
        pointBackgroundColor: chartData.map(d => d.isAlert ? "#ef4444" : baseColor),
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      },
      {
        label: "Limit",
        data: chartData.map((d) => ({ x: d.x, y: cfg?.threshold })),
        borderColor: "#ef4444",
        borderDash: [6, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      }
    ];

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        plugins: {
          legend: { display: false },
          zoom: {
            pan: { enabled: true, mode: "x" },
            zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" }
          },
          tooltip: {
            backgroundColor: themeColors.tooltipBg,
            borderColor: themeColors.tooltipBorder,
            borderWidth: 1,
            cornerRadius: 12,
            padding: 12,
            callbacks: {
              title: (items) => {
                const date = new Date(items[0].raw.x);
                return date.toLocaleString('th-TH', {
                  hour: '2-digit',
                  minute: '2-digit',
                  day: 'numeric',
                  month: 'short',
                  hour12: false // 💡 บังคับ 24 ชม. ใน Tooltip
                });
              },
              label: (context) => ` ${context.dataset.label}: ${context.raw.y} ${cfg?.unit}`
            }
          }
        },
        scales: {
          x: {
            type: "time",
            adapters: { date: { locale: th } },
            time: {
              displayFormats: getDisplayFormat() // 💡 ใช้ฟังก์ชันแยกรูปแบบตามช่วงเวลา
            },
            grid: { display: false },
            ticks: {
              color: themeColors.text,
              font: { size: 10 },
              autoSkip: true,
              maxRotation: 0,
              callback: function(value) {
                // บังคับการแสดงผลผ่าน displayFormats
                return this.getLabelForValue(value);
              }
            }
          },
          y: {
            grid: { color: themeColors.grid, borderDash: [3, 3] },
            ticks: { color: themeColors.text }
          }
        },
        interaction: { intersect: false, mode: "index" }
      }
    });

    return () => chartInstance.current?.destroy();
  }, [history, activeMetric, config, darkMode, timeRange]); // 💡 ใส่ timeRange เพื่อให้กราฟวาดใหม่เมื่อเปลี่ยนช่วงเวลา

  return (
    <div className="relative w-full h-full group">
      <canvas ref={chartRef}></canvas>
      <button
        onClick={() => chartInstance.current?.resetZoom()}
        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 bg-white/90 dark:bg-slate-800/90 shadow-md text-[10px] font-bold py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 transition-all z-10"
      >
        🔄 Reset Zoom
      </button>
    </div>
  );
}