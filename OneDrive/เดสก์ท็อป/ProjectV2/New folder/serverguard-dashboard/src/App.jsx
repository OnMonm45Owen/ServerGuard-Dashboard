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

  // State สำหรับเก็บการแจ้งเตือนรวม (Global Alerts)
  const [globalAlerts, setGlobalAlerts] = useState([]);

  // ดึงข้อมูลประวัติและแจ้งเตือนเฉพาะอุปกรณ์ (Local Alerts) สำหรับหน้า Analytics
  const { history, alerts: localAlerts } = useSensorData(activeDevice?.id, date, timeRange);

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

      const devicesWithLogs = await Promise.all(
        devicesData.map(async (device) => {
          const { data: logs } = await supabase
            .from("sensor_logs")
            .select("temperature, humidity, current_amp, noise_level, created_at")
            .eq("device_id", device.id)
            .order("created_at", { ascending: false })
            .limit(1);

          const latestLog = logs && logs.length > 0 ? logs[0] : null;

          // 💡 คำนวณสถานะอุปกรณ์ (Online / Warning / Offline)
          let currentStatus = device.status;
          if (latestLog && currentStatus === "online") {
            const hasIssue = Object.keys(METRICS_CONFIG).some(
              (m) => latestLog[m] > METRICS_CONFIG[m].threshold
            );
            if (hasIssue) {
              currentStatus = "warning"; // เปลี่ยนสถานะเป็น warning ถ้ามีค่าเกินเกณฑ์
              
              // เก็บแจ้งเตือนเริ่มต้นสำหรับหน้า Home
              Object.keys(METRICS_CONFIG).forEach((m) => {
                if (latestLog[m] > METRICS_CONFIG[m].threshold) {
                  initialAlerts.push({
                    metric: m,
                    value: latestLog[m],
                    time: latestLog.created_at,
                    device_id: device.id,
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
            current_amp: latestLog?.current_amp ?? null,
            noise_level: latestLog?.noise_level ?? null,
          };
        })
      );

      // เรียงและตั้งค่าแจ้งเตือนเริ่มต้น
      setGlobalAlerts(initialAlerts.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15));
      setDevices(devicesWithLogs);
      setLoading(false);
    };

    fetchDevices();

    // ดักฟังข้อมูล Real-time (Global Stream)
    const globalChannel = supabase
      .channel("global-sensor-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_logs" },
        (payload) => {
          const log = payload.new;

          setDevices((prevDevices) =>
            prevDevices.map((d) => {
              if (d.id === log.device_id) {
                // เช็คว่าข้อมูลใหม่ทำให้ติดสถานะ Warning หรือไม่
                const hasIssue = Object.keys(METRICS_CONFIG).some(
                  (m) => log[m] > METRICS_CONFIG[m].threshold
                );
                return {
                  ...d,
                  status: hasIssue ? "warning" : "online",
                  temperature: log.temperature,
                  humidity: log.humidity,
                  current_amp: log.current_amp,
                  noise_level: log.noise_level,
                };
              }
              return d;
            })
          );

          // อัปเดตรายการแจ้งเตือนรวม
          Object.keys(METRICS_CONFIG).forEach((m) => {
            if (log[m] > METRICS_CONFIG[m].threshold) {
              setGlobalAlerts((prev) => [
                { metric: m, value: log[m], time: log.created_at, device_id: log.device_id },
                ...prev,
              ].slice(0, 15)); 
            }
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(globalChannel);
  }, []);

  const openAnalytics = (device) => {
    setActiveDevice(device);
    setView("analytics");
  };

  const goHome = () => {
    setView("home");
    setActiveDevice(null);
  };

  // 💡 เลือกแจ้งเตือนที่จะส่งไปให้ Popup (หน้า Home แสดงทั้งหมด / หน้า Analytics แสดงเฉพาะของอุปกรณ์นั้น)
  const activeAlerts = view === "analytics" ? localAlerts : globalAlerts;

  return (
    <div className={darkMode ? "dark" : ""}>
      {/* 💡 เปลี่ยนสีพื้นหลังโหมดปกติ: 
         จากเดิม bg-white หรือ bg-gray-100 
         เป็น bg-[#F0F2F5] (Slate Gray) หรือ bg-[#F4F7FA] (Soft Navy White)
      */}
      <div className="min-h-screen bg-[#F4F7FA] dark:bg-[#161D31] text-slate-800 dark:text-[#D0D2D6] transition-colors duration-300 font-sans">
        
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} onHomeClick={goHome} />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {view === "home" && (
            <HomeView 
              devices={devices} 
              loading={loading} 
              onNavigate={openAnalytics} 
            />
          )}

          {view === "analytics" && activeDevice && (
            <AnalyticsView
              device={activeDevice}
              history={history}
              activeMetric={metric}
              onMetricChange={setMetric}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              selectedDate={date}
              setSelectedDate={setDate}
              alerts={localAlerts}
              onBack={goHome}
              darkMode={darkMode}
            />
          )}
        </main>

        <AlertPopup alerts={activeAlerts} devices={devices} view={view} />
      </div>
    </div>
  );
}