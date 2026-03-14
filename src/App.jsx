import React, { useEffect, useState, useCallback } from "react";
import Navbar from "./components/Navbar";
import HomeView from "./views/HomeView";
import AnalyticsView from "./views/AnalyticsView";
import SettingsView from "./views/SettingsView";
import LoginView from "./views/LoginView";
import AlertPopup from "./components/AlertPopup";
import useSensorData from "./hooks/useSensorData";
import { supabase } from "./lib/supabase";
import { METRICS_CONFIG } from "./utils/metricsConfig";

export default function App() {
  const [user, setUser] = useState(null);
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
  const [pingResults, setPingResults] = useState({});

  // 1. 💡 ใช้ useCallback เพื่อให้ฟังก์ชันไม่ถูกสร้างใหม่ทุกครั้งที่เรนเดอร์ (แก้ Missing Dependency)
  const checkActiveWarning = useCallback((deviceId, latestLog) => {
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
  }, [dismissedAlerts]);

  const calculateDeviceStatus = useCallback((deviceId, latestLog) => {
    const TIMEOUT_MS = 300 * 1000; // 5 นาที
    if (!latestLog) return pingResults[deviceId]?.success ? "standby" : "offline";

    const lastSeen = new Date(latestLog.created_at).getTime();
    const isActive = (Date.now() - lastSeen) < TIMEOUT_MS;

    if (isActive) {
      return checkActiveWarning(deviceId, latestLog) ? "warning" : "online";
    } else if (pingResults[deviceId]?.success) {
      return "standby";
    }
    return "offline";
  }, [pingResults, checkActiveWarning]);

  // 2. 💡 ย้าย fetchDevices ขึ้นมาประกาศด้านบน (แก้ 'fetchDevices' is not defined)
  const fetchDevices = useCallback(async () => {
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
          .select("temperature, humidity, voltage, sound_db, created_at")
          .eq("device_id", device.id)
          .order("created_at", { ascending: false })
          .limit(1);

        const latestLog = logs && logs.length > 0 ? logs[0] : null;
        const currentStatus = calculateDeviceStatus(device.id, latestLog);

        if (currentStatus === "online" || currentStatus === "warning") {
          Object.keys(METRICS_CONFIG).forEach((m) => {
            const val = latestLog[m];
            const conf = METRICS_CONFIG[m];
            if (conf && !conf.isMultiLine && (val > conf.threshold || (conf.thresholdMin && val < conf.thresholdMin))) {
              initialAlerts.push({ metric: m, value: val, time: latestLog.created_at, device_id: device.id });
            }
          });
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
  }, [calculateDeviceStatus]);

  // 3. 💡 แก้ไข Cascading Render Error: ลบ useEffect ที่เฝ้าดู [view] ทิ้ง
  // แล้วเปลี่ยนมารีเซ็ตผ่านฟังก์ชันการนำทางแทน
  const navigateTo = (targetView, device = null) => {
    setDismissedAlerts([]); // รีเซ็ตการแจ้งเตือนที่กดปิดเมื่อเปลี่ยนหน้า
    setView(targetView);
    if (device) setActiveDevice(device);
  };

  const goHome = () => navigateTo("home");
  const openAnalytics = (device) => navigateTo("analytics", device);
  const openSettings = () => navigateTo("settings");

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

  const handleManualPing = async (deviceId, ipAddress) => {
    if (!ipAddress) return alert("No IP/URL configured for this device.");
    setPingResults(prev => ({ ...prev, [deviceId]: { loading: true } }));
    const startTime = Date.now();
    const targetUrl = ipAddress.startsWith('http') ? ipAddress : `http://${ipAddress}`;

    try {
      await fetch(targetUrl, { mode: 'no-cors', cache: 'no-cache' });
      const latency = Date.now() - startTime;

      setPingResults(prev => ({
        ...prev,
        [deviceId]: { loading: false, success: true, latency: latency, time: new Date() }
      }));

      setDevices(prev => prev.map(d =>
        d.id === deviceId && d.status === "offline" ? { ...d, status: "standby" } : d
      ));

      setGlobalAlerts(prev => prev.filter(a => !(a.device_id === deviceId && a.metric === "status")));
    } catch { // 💡 แก้ไข 'err' is defined but never used
      setPingResults(prev => ({
        ...prev,
        [deviceId]: { loading: false, success: false, latency: 0, time: new Date() }
      }));
    }
  };

  useEffect(() => {
    devices.forEach(d => {
      if (d.status === "offline") {
        setGlobalAlerts(prev => {
          const exists = prev.find(a => a.device_id === d.id && a.metric === "status");
          if (!exists) {
            return [{
              metric: "status",
              value: "DOWN",
              time: new Date().toISOString(),
              device_id: d.id
            }, ...prev].slice(0, 15);
          }
          return prev;
        });
      }
    });
  }, [devices]);

  useEffect(() => {
    fetchDevices();

    const globalChannel = supabase
      .channel("global-sensor-stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sensor_logs" }, (payload) => {
        const log = payload.new;
        setDevices((prevDevices) =>
          prevDevices.map((d) => {
            if (d.id === log.device_id) {
              const status = calculateDeviceStatus(log.device_id, log);
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
  }, [fetchDevices, calculateDeviceStatus]); // 💡 ใส่ Dependencies ให้ครบถ้วน

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView("home");
  };

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
          {view === "home" && (
            <HomeView
              devices={devices || []}
              loading={loading}
              onNavigate={openAnalytics}
              pingResults={pingResults || {}}
              onPing={handleManualPing}
            />
          )}

          {view === "analytics" && activeDevice && (
            <AnalyticsView
              device={activeDevice} history={history} activeMetric={metric} onMetricChange={setMetric}
              timeRange={timeRange} setTimeRange={setTimeRange} selectedDate={date} setSelectedDate={setDate}
              alerts={localAlerts} onBack={goHome} darkMode={darkMode}
            />
          )}

          {view === "settings" && (
            <SettingsView onBack={goHome} onRefreshConfig={fetchDevices} />
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