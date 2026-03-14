import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import HomeView from "./views/HomeView";
import AnalyticsView from "./views/AnalyticsView";
import SettingsView from "./views/SettingsView"; // นำเข้าหน้าตั้งค่า
import LoginView from "./views/LoginView"; // นำเข้าหน้า Login
import AlertPopup from "./components/AlertPopup";
import useSensorData from "./hooks/useSensorData";
import { supabase } from "./lib/supabase";
import { METRICS_CONFIG } from "./utils/metricsConfig";

export default function App() {
  const [user, setUser] = useState(null); // เก็บสถานะการเข้าสู่ระบบ
  const [view, setView] = useState("home");
  const [devices, setDevices] = useState([]);
  const [activeDevice, setActiveDevice] = useState(null);
  const [metric, setMetric] = useState("temperature");
  const [timeRange, setTimeRange] = useState("24h");
  const [date, setDate] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [globalAlerts, setGlobalAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);

  // ตรวจสอบ Session การ Login
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const { history, alerts: localAlerts } = useSensorData(activeDevice?.id, date, timeRange);

  // ฟังก์ชันเช็ค Warning สำหรับสถานะอุปกรณ์
  const checkActiveWarning = (deviceId, latestLog) => {
    if (!latestLog) return false;
    return Object.keys(METRICS_CONFIG).some((m) => {
      const conf = METRICS_CONFIG[m];
      const val = latestLog[m];
      if (!conf || val === null || conf.isMultiLine) return false;

      const isExceeded = val > conf.threshold || (conf.thresholdMin && val < conf.thresholdMin);
      if (isExceeded) {
        const alertKey = `${deviceId}-${latestLog.created_at}-${m}`;
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

    // ระบบ Real-time Monitoring
    const globalChannel = supabase
      .channel("global-sensor-stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sensor_logs" }, (payload) => {
        const log = payload.new;
        setDevices((prevDevices) =>
          prevDevices.map((d) => {
            if (d.id === log.device_id) {
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
      })
      .subscribe();

    return () => supabase.removeChannel(globalChannel);
  }, [dismissedAlerts]);

  const openAnalytics = (device) => { setView("analytics"); setActiveDevice(device); };
  const goHome = () => { setView("home"); setActiveDevice(null); };
  const openSettings = () => { setView("settings"); }; // ฟังก์ชันไปหน้าตั้งค่า

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView("home");
  };

  // ตรวจสอบว่า Login หรือยัง
  if (!user) {
    return <LoginView onLoginSuccess={(user) => setUser(user)} />;
  }

  const activeAlerts = view === "analytics" ? localAlerts : globalAlerts;

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[#E2E8F0] dark:bg-[#0F172A] text-slate-800 dark:text-[#D0D2D6] transition-colors duration-300 font-sans">
        <Navbar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode} 
          onHomeClick={goHome} 
          onSettingsClick={openSettings} 
          onLogout={handleLogout} 
        />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {view === "home" && <HomeView devices={devices} loading={loading} onNavigate={openAnalytics} />}
          
          {view === "analytics" && activeDevice && (
            <AnalyticsView
              device={activeDevice} history={history} activeMetric={metric} onMetricChange={setMetric}
              timeRange={timeRange} setTimeRange={setTimeRange} selectedDate={date} setSelectedDate={setDate}
              alerts={localAlerts} onBack={goHome} darkMode={darkMode}
            />
          )}

          {/* แสดงหน้า SettingsView */}
          {view === "settings" && (
            <SettingsView onBack={goHome} />
          )}
        </main>

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