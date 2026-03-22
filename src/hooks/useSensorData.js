// src/hooks/useSensorData.js
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

// 💡 รับ metricsConfig เพิ่มเข้ามาเป็นพารามิเตอร์
export default function useSensorData(deviceId, selectedDate, timeRange = "24h", metricsConfig = {}) {
    const [history, setHistory] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const formatLog = useCallback((log) => ({
        ...log,
        time: new Date(log.created_at).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }), []);

    const checkAlert = useCallback((log) => {
        let newAlerts = [];
        Object.keys(metricsConfig).forEach((metricId) => {
            const conf = metricsConfig[metricId];
            const val = log[metricId];

            if (val !== undefined && val !== null && conf && !conf.is_multi_line) {
                const isOverMax = conf.threshold !== null && val > conf.threshold;
                const isUnderMin = conf.threshold_min !== null && val < conf.threshold_min;

                if (isOverMax || isUnderMin) {
                    newAlerts.push({ 
                        metric: metricId, 
                        message: `${conf.label} ผิดปกติ!`, 
                        value: val, 
                        time: log.created_at, 
                        device_id: log.device_id 
                    });
                }
            }
        });
        if (newAlerts.length > 0) setAlerts((prev) => [...newAlerts, ...prev].slice(0, 30));
    }, [metricsConfig]);

    useEffect(() => {
        if (!deviceId || Object.keys(metricsConfig).length === 0) return;

        const fetchHistory = async () => {
            let start, end;
            if (timeRange === "1h") {
                end = new Date();
                start = new Date(end.getTime() - 3600000);
            } else {
                end = selectedDate ? new Date(selectedDate) : new Date();
                if (selectedDate) end.setHours(23, 59, 59, 999);
                start = new Date(end);
                if (timeRange === "24h") start.setHours(0, 0, 0, 0);
                else if (timeRange === "7d") start.setDate(start.getDate() - 6);
                else if (timeRange === "30d") start.setDate(start.getDate() - 29);
            }

            const { data } = await supabase
                .from("sensor_logs")
                .select("*")
                .eq("device_id", deviceId)
                .gte("created_at", start.toISOString())
                .lte("created_at", end.toISOString())
                .order("created_at", { ascending: true });

            if (data && data.length > 0) {
                setHistory(data.map(formatLog));
                const pastAlerts = [];
                [...data].reverse().forEach(log => {
                    Object.keys(metricsConfig).forEach(mId => {
                        const c = metricsConfig[mId];
                        if (c && !c.is_multi_line) {
                            if (log[mId] > c.threshold || (c.threshold_min !== null && log[mId] < c.threshold_min)) {
                                pastAlerts.push({ metric: mId, message: `${c.label} ผิดปกติ!`, value: log[mId], time: log.created_at, device_id: log.device_id });
                            }
                        }
                    });
                });
                setAlerts(pastAlerts.slice(0, 30));
            } else {
                setHistory([]);
                setAlerts([]); 
            }
        };

        fetchHistory();

        const isToday = !selectedDate || new Date(selectedDate).toDateString() === new Date().toDateString();
        let channel;
        
        if (isToday) {
            channel = supabase
                .channel(`sensor-stream-${deviceId}`)
                .on("postgres_changes", { event: "INSERT", schema: "public", table: "sensor_logs", filter: `device_id=eq.${deviceId}` }, 
                (payload) => {
                    const log = payload.new;
                    setHistory((prev) => {
                        const newHistory = [...prev, formatLog(log)];
                        if (timeRange === "1h") {
                            const oneHourAgo = Date.now() - 3600000;
                            return newHistory.filter(item => new Date(item.created_at).getTime() > oneHourAgo);
                        }
                        return newHistory;
                    });
                    checkAlert(log);
                })
                .subscribe();
        }

        return () => { if (channel) supabase.removeChannel(channel); };
    }, [deviceId, selectedDate, timeRange, metricsConfig, checkAlert, formatLog]);

    return { history, alerts };
}