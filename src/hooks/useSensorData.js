import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { METRICS_CONFIG } from "../utils/metricsConfig";

// 💡 รับค่า timeRange เข้ามาเพื่อดึงข้อมูลย้อนหลังตามช่วงเวลาที่เลือก
export default function useSensorData(deviceId, selectedDate, timeRange = "24h") {
  const [history, setHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // ฟังก์ชันจัดรูปแบบข้อมูลก่อนนำไปใช้งานใน App
  const formatLog = (log) => ({
    created_at: log.created_at,
    time: new Date(log.created_at).toLocaleTimeString("th-TH"),
    temperature: log.temperature,
    humidity: log.humidity,
    voltage: log.voltage,     // เปลี่ยนจาก current_amp เป็น voltage
    sound_db: log.sound_db,   // เพิ่มข้อมูลระดับเสียง dB
    sound_rms: log.sound_rms, // เพิ่มข้อมูล sound_rms
    sound_peak: log.sound_peak, // เพิ่มข้อมูล sound_peak
  });

  // ฟังก์ชันดึงประวัติ Alert จากข้อมูลที่ดึงมา
  const loadPastAlerts = (logs) => {
    const pastAlerts = [];
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      
      // 1. ตรวจสอบเงื่อนไขแจ้งเตือนความชื้น (Humidity)
      if (log.humidity > METRICS_CONFIG.humidity.threshold) {
        pastAlerts.push({
          metric: "humidity",
          message: "💦 ความชื้นสูงเกินกำหนด! เสี่ยงเกิดหยดน้ำ",
          value: log.humidity,
          time: log.created_at,
          device_id: log.device_id,
        });
      } else if (METRICS_CONFIG.humidity.thresholdMin && log.humidity < METRICS_CONFIG.humidity.thresholdMin) {
        pastAlerts.push({
          metric: "humidity",
          message: "🌵 ความชื้นต่ำเกินไป! เสี่ยงเกิดไฟฟ้าสถิต",
          value: log.humidity,
          time: log.created_at,
          device_id: log.device_id,
        });
      }

      // 2. ตรวจสอบเงื่อนไขแจ้งเตือนเสียงกระแทก (Peak > 0.6)
      if (log.sound_peak > 0.6) {
        pastAlerts.push({
          metric: "sound_peak",
          message: "แจ้งเตือนเสียงกระแทก!",
          value: log.sound_peak,
          time: log.created_at,
          device_id: log.device_id,
        });
      }

      // 3. ตรวจสอบเงื่อนไขแจ้งเตือนเสียงดังผิดปกติ (dB > 70)
      if (log.sound_db > 70) {
        pastAlerts.push({
          metric: "sound_db",
          message: "แจ้งเตือนเสียงดังผิดปกติ!",
          value: log.sound_db,
          time: log.created_at,
          device_id: log.device_id,
        });
      }

      // 4. ตรวจสอบ Metric อื่นๆ (Temperature, Voltage) ตาม Threshold ใน Config
      const otherMetrics = ["temperature", "voltage"];
      otherMetrics.forEach((metric) => {
        if (log[metric] > METRICS_CONFIG[metric]?.threshold) {
          pastAlerts.push({
            metric,
            message: `${METRICS_CONFIG[metric].label} สูงเกินกำหนด!`,
            value: log[metric],
            time: log.created_at,
            device_id: log.device_id,
          });
        }
      });
    }
    setAlerts(pastAlerts.slice(0, 30)); // เก็บประวัติล่าสุด 30 รายการ
  };

  // ฟังก์ชันตรวจสอบการแจ้งเตือนสำหรับข้อมูล Real-time ที่เพิ่งเข้ามา
  const checkAlert = (log) => {
    let newAlerts = [];

    // ตรวจสอบความชื้น Real-time
    if (log.humidity > METRICS_CONFIG.humidity.threshold) {
      newAlerts.push({
        metric: "humidity",
        message: "💦 ความชื้นสูงเกินกำหนด! เสี่ยงเกิดหยดน้ำ",
        value: log.humidity,
        time: log.created_at,
        device_id: log.device_id,
      });
    } else if (METRICS_CONFIG.humidity.thresholdMin && log.humidity < METRICS_CONFIG.humidity.thresholdMin) {
      newAlerts.push({
        metric: "humidity",
        message: "🌵 ความชื้นต่ำเกินไป! เสี่ยงเกิดไฟฟ้าสถิต",
        value: log.humidity,
        time: log.created_at,
        device_id: log.device_id,
      });
    }

    if (log.sound_peak > 0.6) {
      newAlerts.push({
        metric: "sound_peak",
        message: "แจ้งเตือนเสียงกระแทก!",
        value: log.sound_peak,
        time: log.created_at,
        device_id: log.device_id,
      });
    }

    if (log.sound_db > 70) {
      newAlerts.push({
        metric: "sound_db",
        message: "แจ้งเตือนเสียงดังผิดปกติ!",
        value: log.sound_db,
        time: log.created_at,
        device_id: log.device_id,
      });
    }

    const otherMetrics = ["temperature", "voltage"];
    otherMetrics.forEach((metric) => {
      if (log[metric] > METRICS_CONFIG[metric]?.threshold) {
        newAlerts.push({
          metric,
          message: `${METRICS_CONFIG[metric].label} สูงเกินกำหนด!`,
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
      const end = selectedDate ? new Date(selectedDate) : new Date();
      end.setHours(23, 59, 59, 999);

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

      // ดึงข้อมูลจากตาราง sensor_logs
      const { data } = await supabase
        .from("sensor_logs")
        .select("*")
        .eq("device_id", deviceId)
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: true })
        .limit(5000);

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
    
    // ตั้งค่า Realtime Subscription
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
  }, [deviceId, selectedDate, timeRange]);

  return { history, alerts };
}