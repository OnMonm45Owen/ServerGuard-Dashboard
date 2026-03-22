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

    const getPointData = (log, metricKey, cfg) => ({
        x: new Date(log.created_at),
        y: parseFloat(log[metricKey]) || 0,
        isAlert: (cfg.threshold !== null && log[metricKey] > cfg.threshold) || 
                 (cfg.threshold_min !== null && log[metricKey] < cfg.threshold_min)
    });

    useEffect(() => {
        if (!chartRef.current) return;
        
        const cfg = config[activeMetric];
        if (!cfg) return;

        if (chartInstance.current) chartInstance.current.destroy();
        const ctx = chartRef.current.getContext("2d");

        let datasets = [];

        if (cfg.is_multi_line && cfg.lines) {
            datasets = cfg.lines.map(line => ({
                label: line.label,
                data: history.map(log => getPointData(log, line.key, cfg)).sort((a, b) => a.x - b.x),
                borderColor: line.color,
                backgroundColor: `${line.color}22`,
                fill: false,
                tension: 0.3,
                borderWidth: 2,
                pointRadius: 0
            }));
        } else {
            const baseColor = cfg?.color || "#3b82f6";
            const displayData = history.map(log => getPointData(log, activeMetric, cfg)).sort((a, b) => a.x - b.x);
            
            datasets.push({
                label: `${cfg?.label} (${cfg?.unit})`,
                data: displayData,
                borderColor: baseColor,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) return null;
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, darkMode ? `${baseColor}33` : `${baseColor}44`);
                    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                    return gradient;
                },
                fill: true,
                tension: 0.3,
                borderWidth: 3,
                pointRadius: (ctx) => (ctx.raw?.isAlert ? 5 : 0),
                pointBackgroundColor: (ctx) => ctx.raw?.isAlert ? "#ef4444" : baseColor,
            });
        }

        // 🚨 เพิ่มเส้น Max Limit (Threshold) สีแดงประ
        if (cfg.threshold !== null && cfg.threshold !== undefined && history.length > 0) {
            const sorted = [...history].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            datasets.push({
                label: `Max Limit (${cfg.threshold})`,
                data: [
                    { x: new Date(sorted[0].created_at), y: cfg.threshold },
                    { x: new Date(sorted[sorted.length - 1].created_at), y: cfg.threshold }
                ],
                borderColor: "#ef4444",
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
            });
        }

        // 🚨 เพิ่มเส้น Min Limit (Threshold Min) สีส้มประ
        if (cfg.threshold_min !== null && cfg.threshold_min !== undefined && history.length > 0) {
            const sorted = [...history].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            datasets.push({
                label: `Min Limit (${cfg.threshold_min})`,
                data: [
                    { x: new Date(sorted[0].created_at), y: cfg.threshold_min },
                    { x: new Date(sorted[sorted.length - 1].created_at), y: cfg.threshold_min }
                ],
                borderColor: "#f97316",
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
            });
        }

        const themeColors = {
            grid: darkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
            text: darkMode ? "#94a3b8" : "#475569",
            tooltipBg: darkMode ? "#0f172a" : "#1e293b",
        };

        chartInstance.current = new Chart(ctx, {
            type: "line",
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: cfg.is_multi_line || cfg.threshold !== null || cfg.threshold_min !== null, // แสดง Legend เมื่อมีหลายเส้น หรือมีเส้น Limit
                        labels: { color: themeColors.text, font: { weight: 'bold' } }
                    },
                    zoom: {
                        pan: { enabled: true, mode: "x" },
                        zoom: { wheel: { enabled: true }, pinch: { enabled: true }, mode: "x" }
                    },
                    tooltip: {
                        backgroundColor: themeColors.tooltipBg,
                        padding: 12,
                        titleFont: { size: 14, weight: 'bold' },
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
                        ticks: { color: themeColors.text, font: { weight: 'bold', size: 10 } }
                    },
                    y: {
                        suggestedMax: cfg.threshold !== null ? cfg.threshold * 1.1 : undefined, 
                        suggestedMin: cfg.threshold_min !== null ? cfg.threshold_min * 0.9 : undefined, 
                        grid: { color: themeColors.grid },
                        ticks: { 
                            color: themeColors.text, 
                            font: { weight: '900' },
                            callback: (value) => `${value} ${cfg.unit}`
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