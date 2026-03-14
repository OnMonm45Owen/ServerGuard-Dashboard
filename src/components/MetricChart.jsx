// src/components/MetricChart.jsx
import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";
import 'chartjs-adapter-date-fns'; 
import { th } from 'date-fns/locale'; 

Chart.register(zoomPlugin);

export default function MetricChart({ history, activeMetric, config, darkMode, timeRange }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    // 💡 ฟังก์ชันใหม่สำหรับหาค่าเฉลี่ยตามช่วงเวลา (มิลลิวินาที)
    const aggregateDataByMs = (data, intervalMs, cfg) => {
        if (!data || data.length === 0) return [];
        const groups = {};
        
        data.forEach(item => {
            const time = new Date(item.x).getTime();
            // จัดกลุ่มตามช่วงเวลาที่กำหนด (เช่น ทุก 20000ms)
            const groupKey = Math.floor(time / intervalMs) * intervalMs;
            
            if (!groups[groupKey]) {
                groups[groupKey] = { sum: 0, count: 0, hasAlert: false };
            }
            groups[groupKey].sum += item.y;
            groups[groupKey].count += 1;
            
            // ตรวจสอบ Alert ในกลุ่มข้อมูล
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

    // ฟังก์ชันเดิม (คงไว้สำหรับ 7d/30d)
    const aggregateData = (data, pointsPerDay, cfg) => {
        if (!data || data.length === 0) return [];
        const intervalMs = (24 * 60 * 60 * 1000) / pointsPerDay;
        return aggregateDataByMs(data, intervalMs, cfg);
    };

    useEffect(() => {
        if (!chartRef.current) return;
        if (chartInstance.current) chartInstance.current.destroy();

        const ctx = chartRef.current.getContext("2d");
        const cfg = config[activeMetric];
        if (!cfg) return;

        const baseColor = cfg?.color || "#3b82f6";

        // 1. เตรียมข้อมูลพื้นฐาน (Detailed)
        const detailedData = history.map(log => ({
            x: new Date(log.created_at),
            y: parseFloat(log[activeMetric]) || 0,
            isAlert: log[activeMetric] > cfg.threshold || (cfg.thresholdMin && log[activeMetric] < cfg.thresholdMin)
        })).sort((a, b) => a.x - b.x);

        // 2. จัดการการรวมกลุ่มข้อมูลตามช่วงเวลา
        let displayData = detailedData;
        
        if (timeRange === '1h') {
            // 💡 เฉลี่ยข้อมูลทุก 20 วินาที (20,000 ms)
            displayData = aggregateDataByMs(detailedData, 20000, cfg);
        } else if (timeRange === '24h') {
            // เฉลี่ยทุก 5 นาที เพื่อให้กราฟนิ่งขึ้น (Optional)
            displayData = aggregateDataByMs(detailedData, 5 * 60 * 1000, cfg);
        } else if (timeRange === '7d') {
            displayData = aggregateData(detailedData, 8, cfg);
        } else if (timeRange === '30d') {
            displayData = aggregateData(detailedData, 4, cfg);
        }

        const themeColors = {
            grid: darkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            text: darkMode ? "#94a3b8" : "#475569",
            tooltipBg: darkMode ? "#0f172a" : "#1e293b",
        };

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, darkMode ? `${baseColor}33` : `${baseColor}44`);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        chartInstance.current = new Chart(ctx, {
            type: "line",
            data: {
                datasets: [
                    {
                        label: `${cfg?.label} (${cfg?.unit})`,
                        data: displayData,
                        borderColor: baseColor,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.3,
                        borderWidth: 3,
                        pointRadius: (ctx) => (ctx.raw?.isAlert ? 5 : timeRange === '1h' ? 2 : 0),
                        pointBackgroundColor: (ctx) => ctx.raw?.isAlert ? "#ef4444" : baseColor,
                    },
                    {
                        label: `Limit (${cfg.threshold})`,
                        data: displayData.length > 0 ? [
                            { x: displayData[0].x, y: cfg.threshold },
                            { x: displayData[displayData.length - 1].x, y: cfg.threshold }
                        ] : [],
                        borderColor: "#ef4444",
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    zoom: {
                        pan: { enabled: true, mode: "x" },
                        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" }
                    },
                    tooltip: {
                        backgroundColor: themeColors.tooltipBg,
                        callbacks: {
                            title: (items) => new Date(items[0].raw.x).toLocaleString('th-TH', {
                                hour: '2-digit', minute: '2-digit', second: '2-digit',
                                day: 'numeric', month: 'short'
                            }),
                        }
                    }
                },
                scales: {
                    x: {
                        type: "time",
                        adapters: { date: { locale: th } },
                        time: {
                            unit: timeRange === '1h' ? 'minute' : 'hour',
                            displayFormats: { minute: 'HH:mm', hour: 'HH:mm' }
                        },
                        grid: { display: false },
                        ticks: {
                            color: themeColors.text,
                            font: { weight: 'bold', size: 10 },
                        }
                    },
                    y: {
                        // 💡 ตั้งค่าสเกลแกน Y ให้คงที่โดยอ้างอิงจากเกณฑ์ (Threshold)
                        beginAtZero: true,
                        // ให้สเกลสูงสุดสูงกว่า Threshold 20% เสมอเพื่อให้กราฟไม่กระโดดไปมา
                        suggestedMax: cfg.threshold * 1.2, 
                        grid: { color: themeColors.grid },
                        ticks: { 
                            color: themeColors.text, 
                            font: { weight: '900' },
                            callback: (value) => `${value}${cfg.unit}`
                        }
                    }
                },
                interaction: { intersect: false, mode: "index" }
            }
        });

        return () => chartInstance.current?.destroy();
    }, [history, activeMetric, config, darkMode, timeRange]);

    return (
        <div className="relative w-full h-full group">
            <canvas ref={chartRef}></canvas>
            <button
                onClick={() => chartInstance.current?.resetZoom()}
                className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 bg-slate-900 dark:bg-indigo-600 text-white text-[10px] font-black py-1 px-3 rounded-lg shadow-xl transition-all"
            >
                Reset Zoom
            </button>
        </div>
    );
}