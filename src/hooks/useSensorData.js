// src/hooks/useSensorData.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { METRICS_CONFIG } from "../utils/metricsConfig";

export default function useSensorData(deviceId, selectedDate, timeRange = "24h") {
    const [history, setHistory] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const formatLog = (log) => ({
        created_at: log.created_at,
        time: new Date(log.created_at).toLocaleTimeString("th-TH", { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        temperature: log.temperature,
        humidity: log.humidity,
        voltage: log.voltage,     
        sound_db: log.sound_db,
    });

    // 💡 ฟังก์ชันตรวจสอบการแจ้งเตือน
    const checkAlert = (log) => {
        let newAlerts = [];
        if (log.sound_db > 70) {
            newAlerts.push({ metric: "sound_db", message: "แจ้งเตือนเสียงดังผิดปกติ!", value: log.sound_db, time: log.created_at, device_id: log.device_id });
        }
        const otherMetrics = ["temperature", "humidity", "voltage"];
        otherMetrics.forEach((metric) => {
            const conf = METRICS_CONFIG[metric];
            if (log[metric] > conf?.threshold || (conf?.thresholdMin && log[metric] < conf.thresholdMin)) {
                newAlerts.push({ metric, message: `${conf.label} ผิดปกติ!`, value: log[metric], time: log.created_at, device_id: log.device_id });
            }
        });
        if (newAlerts.length > 0) setAlerts((prev) => [...newAlerts, ...prev].slice(0, 30));
    };

    const loadPastAlerts = (data) => {
        const pastAlerts = [];
        for (let i = data.length - 1; i >= 0; i--) {
            const log = data[i];
            if (log.sound_db > 70) {
                pastAlerts.push({ metric: "sound_db", message: "แจ้งเตือนเสียงดังผิดปกติ!", value: log.sound_db, time: log.created_at, device_id: log.device_id });
            }
            const otherMetrics = ["temperature", "humidity", "voltage"];
            otherMetrics.forEach((metric) => {
                const conf = METRICS_CONFIG[metric];
                if (log[metric] > conf?.threshold || (conf?.thresholdMin && log[metric] < conf.thresholdMin)) {
                    pastAlerts.push({ metric, message: `${conf.label} ผิดปกติ!`, value: log[metric], time: log.created_at, device_id: log.device_id });
                }
            });
        }
        setAlerts(pastAlerts.slice(0, 30));
    };

    useEffect(() => {
        if (!deviceId) return;

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

            // 💡 แก้ไข: ลบ error ออกเพราะไม่ได้ใช้งาน เพื่อแก้ ESLint Error
            const { data } = await supabase
                .from("sensor_logs")
                .select("*")
                .eq("device_id", deviceId)
                .gte("created_at", start.toISOString())
                .lte("created_at", end.toISOString())
                .order("created_at", { ascending: true });

            if (data && data.length > 0) {
                setHistory(data.map(formatLog));
                loadPastAlerts(data);
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
                    checkAlert(log); // 💡 เรียกใช้งานฟังก์ชันที่นิยามไว้ด้านบน
                })
                .subscribe();
        }

        return () => { if (channel) supabase.removeChannel(channel); };
    }, [deviceId, selectedDate, timeRange]);

    return { history, alerts };
}