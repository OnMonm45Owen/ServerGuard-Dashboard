import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { METRICS_CONFIG } from "../utils/metricsConfig";

// 💡 รับค่า timeRange เข้ามาด้วย
export default function useSensorData(deviceId, selectedDate, timeRange = "24h") {
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const formatLog = (log) => ({
    created_at: log.created_at,
    time: new Date(log.created_at).toLocaleTimeString("th-TH"),
    temperature: log.temperature,
    humidity: log.humidity,
    current_amp: log.current_amp,
    noise_level: log.noise_level,
  });

  // ฟังก์ชันดึงประวัติ Alert ย้อนหลังมาโชว์ในกรอบ History
  const loadPastAlerts = (logs) => {
    const pastAlerts = [];
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      Object.keys(METRICS_CONFIG).forEach((metric) => {
        if (log[metric] > METRICS_CONFIG[metric].threshold) {
          pastAlerts.push({
            metric,
            value: log[metric],
            time: log.created_at,
            device_id: log.device_id,
          });
        }
      });
    }
    setAlerts(pastAlerts.slice(0, 30)); // โชว์ประวัติได้สูงสุด 30 รายการล่าสุด
  };

  const checkAlert = (log) => {
    let newAlerts = [];
    Object.keys(METRICS_CONFIG).forEach((metric) => {
      if (log[metric] > METRICS_CONFIG[metric].threshold) {
        newAlerts.push({
          metric,
          value: log[metric],
          time: log.created_at,
          device_id: log.device_id,
        });
      }
    });
    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev].slice(0, 30));
    }
  };

  useEffect(() => {
    if (!deviceId) return;

    const fetchHistory = async () => {
      // 💡 1. หาวันที่สิ้นสุด (ตามปฏิทินที่เลือก หรือวันนี้)
      const end = selectedDate ? new Date(selectedDate) : new Date();
      end.setHours(23, 59, 59, 999);

      // 💡 2. หาวันที่เริ่มต้น ตามปุ่มที่กด (24h, 7d, 30d)
      const start = new Date(end);
      if (timeRange === "24h") {
        start.setHours(0, 0, 0, 0); 
      } else if (timeRange === "7d") {
        start.setDate(start.getDate() - 6);
        start.setHours(0, 0, 0, 0);
      } else if (timeRange === "30d") {
        start.setDate(start.getDate() - 29);
        start.setHours(0, 0, 0, 0);
      } else if (timeRange === "12m") {
        start.setMonth(start.getMonth() - 11);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
      }

      // ดึงข้อมูลทั้งหมดในช่วงเวลาที่กำหนด
      const { data } = await supabase
        .from("sensor_logs")
        .select("*")
        .eq("device_id", deviceId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: true })
        .limit(5000); // กันเว็บค้างถ้าข้อมูลเยอะเกินไป

      if (data && data.length > 0) {
        setHistory(data.map(formatLog));
        loadPastAlerts(data); // 💡 เรียกโชว์ประวัติ Alert ทันที
      } else {
        setHistory([]);
        setAlerts([]); 
      }
    };

    fetchHistory();

    const isToday = !selectedDate || new Date(selectedDate).toDateString() === new Date().toDateString();
    let channel;
    
    // 💡 ปล่อยให้ Realtime ทำงานเพื่อวาดกราฟต่อท้ายไปเรื่อยๆ
    if (isToday) {
      channel = supabase
        .channel(`sensor-stream-${deviceId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "sensor_logs", filter: `device_id=eq.${deviceId}` },
          (payload) => {
            const log = payload.new;
            setHistory((prev) => [...prev, formatLog(log)]);
            checkAlert(log);
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [deviceId, selectedDate, timeRange]); // 💡 ทำงานใหม่ทุกครั้งที่กดเปลี่ยนเวลา

  return { history, alerts };
}