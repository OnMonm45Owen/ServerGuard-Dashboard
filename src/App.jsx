import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import HomeView from "./views/HomeView";
import AnalyticsView from "./views/AnalyticsView";
import AlertPopup from "./components/AlertPopup";
import useSensorData from "./hooks/useSensorData";
import { supabase } from "./lib/supabase";
import { METRICS_CONFIG } from "./utils/metricsConfig";

export default function App() {
  const [view, setView] = useState("home");
  const [devices, setDevices] = useState([]);
  const [activeDevice, setActiveDevice] = useState(null);
  const [metric, setMetric] = useState("temperature");
  const [timeRange, setTimeRange] = useState("24h");
  const [date, setDate] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [globalAlerts, setGlobalAlerts] = useState([]);

  // 💡 State สำหรับเก็บรายการแจ้งเตือนที่ถูกกดปิด (Dismissed)
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  const { history, alerts: localAlerts } = useSensorData(activeDevice?.id, date, timeRange);

  // 💡 ฟังก์ชันเช็คว่าอุปกรณ์มี Warning ที่ยังไม่ถูกกดปิดหรือไม่
  const checkActiveWarning = (deviceId, latestLog) => {
    if (!latestLog) return false;
    return Object.keys(METRICS_CONFIG).some((m) => {
      const conf = METRICS_CONFIG[m];
      const val = latestLog[m];
      if (!conf || val === null || conf.isMultiLine) return false;

      const isExceeded = val > conf.threshold || (conf.thresholdMin && val < conf.thresholdMin);
      if (isExceeded) {
        // สร้าง Key เฉพาะสำหรับการแจ้งเตือนนี้
        const alertKey = `${deviceId}-${latestLog.created_at}-${m}`;
        // แสดงสถานะ Warning ตราบใดที่ Key นี้ยังไม่อยู่ในรายการที่ถูกกดปิด
        return !dismissedAlerts.includes(alertKey);
      }
      return false;
    });
  };

  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      const { data: devicesData, error: devError } = await supabase
        .from("devices")
        .select("*")
        .order('id');
      
      if (devError) {
        console.error("Error fetching devices:", devError);
        setLoading(false);
        return;
      }

      const initialAlerts = [];
      const TIMEOUT_MS = 300 * 1000; // 5 นาที

      const devicesWithLogs = await Promise.all(
        devicesData.map(async (device) => {
          const { data: logs } = await supabase
            .from("sensor_logs")
            .select("temperature, humidity, voltage, sound_db, created_at")
            .eq("device_id", device.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const latestLog = logs && logs.length > 0 ? logs[0] : null;
          let currentStatus = "offline"; 

          if (latestLog) {
            const lastSeen = new Date(latestLog.created_at).getTime();
            const now = Date.now();
            
            if (now - lastSeen < TIMEOUT_MS) {
              // 💡 เปลี่ยนสถานะโดยใช้ฟังก์ชันเช็ค Warning ค้างไว้
              currentStatus = checkActiveWarning(device.id, latestLog) ? "warning" : "online";

              Object.keys(METRICS_CONFIG).forEach((m) => {
                const val = latestLog[m];
                const conf = METRICS_CONFIG[m];
                if (conf && !conf.isMultiLine && (val > conf.threshold || (conf.thresholdMin && val < conf.thresholdMin))) {
                  initialAlerts.push({
                    metric: m, value: val, time: latestLog.created_at, device_id: device.id,
                  });
                }
              });
            }
          }

          return {
            ...device,
            status: currentStatus,
            temperature: latestLog?.temperature ?? null,
            humidity: latestLog?.humidity ?? null,
            voltage: latestLog?.voltage ?? null,
            sound_db: latestLog?.sound_db ?? null,
            last_seen: latestLog?.created_at ?? null 
          };
        })
      );

      setGlobalAlerts(initialAlerts.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15));
      setDevices(devicesWithLogs);
      setLoading(false);
    };

    fetchDevices();

    const timeoutCheck = setInterval(() => {
      const TIMEOUT_MS = 300 * 1000;
      const now = Date.now();
      setDevices(prevDevices => prevDevices.map(d => {
        if (!d.last_seen) return { ...d, status: "offline" };
        const isExpired = now - new Date(d.last_seen).getTime() > TIMEOUT_MS;
        return isExpired ? { ...d, status: "offline" } : d;
      }));
    }, 30000); 

    const globalChannel = supabase
      .channel("global-sensor-stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sensor_logs" }, (payload) => {
        const log = payload.new;
        setDevices((prevDevices) =>
          prevDevices.map((d) => {
            if (d.id === log.device_id) {
              // 💡 เช็คสถานะ Warning ค้างไว้เมื่อมีข้อมูลใหม่เข้ามา
              const status = checkActiveWarning(log.device_id, log) ? "warning" : "online";
              return {
                ...d,
                status: status,
                temperature: log.temperature,
                humidity: log.humidity,
                voltage: log.voltage,
                sound_db: log.sound_db,
                last_seen: log.created_at
              };
            }
            return d;
          })
        );

        Object.keys(METRICS_CONFIG).forEach((m) => {
          const conf = METRICS_CONFIG[m];
          if (conf && !conf.isMultiLine && (log[m] > conf.threshold || (conf.thresholdMin && log[m] < conf.thresholdMin))) {
            setGlobalAlerts((prev) => [
              { metric: m, value: log[m], time: log.created_at, device_id: log.device_id },
              ...prev,
            ].slice(0, 15));
          }
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(globalChannel);
      clearInterval(timeoutCheck);
    };
  }, [dismissedAlerts]); // 💡 ทำงานใหม่เมื่อมีการกดปิดแจ้งเตือน

  const openAnalytics = (device) => { setView("analytics"); setActiveDevice(device); };
  const goHome = () => { setView("home"); setActiveDevice(null); };

  const activeAlerts = view === "analytics" ? localAlerts : globalAlerts;

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[#E2E8F0] dark:bg-[#0F172A] text-slate-800 dark:text-[#D0D2D6] transition-colors duration-300 font-sans">
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} onHomeClick={goHome} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {view === "home" && <HomeView devices={devices} loading={loading} onNavigate={openAnalytics} />}
          {view === "analytics" && activeDevice && (
            <AnalyticsView
              device={activeDevice} history={history} activeMetric={metric} onMetricChange={setMetric}
              timeRange={timeRange} setTimeRange={setTimeRange} selectedDate={date} setSelectedDate={setDate}
              alerts={localAlerts} onBack={goHome} darkMode={darkMode}
            />
          )}
        </main>
        {/* 💡 ส่ง dismissedAlerts และฟังก์ชันเซ็ตค่าไปยัง AlertPopup */}
        <AlertPopup 
          alerts={activeAlerts} 
          devices={devices} 
          view={view} 
          dismissedAlerts={dismissedAlerts}
          setDismissedAlerts={setDismissedAlerts}
        />
      </div>
    </div>
  );
}