// src/App.jsx
import React, { useEffect, useState, useCallback } from "react";
import Navbar from "./components/Navbar";
import HomeView from "./views/HomeView";
import AnalyticsView from "./views/AnalyticsView";
import SettingsView from "./views/SettingsView";
import LoginView from "./views/LoginView";
import AlertPopup from "./components/AlertPopup";
import AddDeviceModal from "./components/AddDeviceModal"; // 💡 นำเข้าปอบอับเพิ่มเครื่องใหม่
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

  // 💡 State สำหรับควบคุมการเปิด/ปิด ปอบอับ
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 1. ฟังก์ชันตรวจสอบการแจ้งเตือน
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

  // 2. ฟังก์ชันคำนวณสถานะอุปกรณ์
  // src/App.jsx

const calculateDeviceStatus = useCallback((deviceId, latestLog) => {
    const TIMEOUT_MS = 300 * 1000; 
    const ping = pingResults[deviceId];
    
    const lastSeen = latestLog ? new Date(latestLog.created_at).getTime() : 0;
    const isDataActive = (Date.now() - lastSeen) < TIMEOUT_MS;

    // 💡 สถานะ Disconnect: ข้อมูลเซ็นเซอร์ยังเข้า (Active) แต่ปิงล่าสุดล้มเหลว
    if (isDataActive && ping && ping.success === false) {
      return "disconnect";
    }

    if (isDataActive) {
      return checkActiveWarning(deviceId, latestLog) ? "warning" : "online";
    } 
    
    if (ping?.success) return "standby";
    
    return "offline";
}, [pingResults, checkActiveWarning]);

  // 3. ฟังก์ชันดึงข้อมูลอุปกรณ์ทั้งหมด
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

  // 🆕 ฟังก์ชันสำหรับการเพิ่มอุปกรณ์ใหม่ผ่านปอบอับ
  const handleAddDevice = async (name, location) => {
    try {
      // 1. 💡 เรียกใช้ RPC เพื่อหาไอดีที่ว่างที่สุดมาใช้
      const { data: nextAvailableId, error: rpcError } = await supabase
        .rpc('get_available_device_id');

      if (rpcError) throw rpcError;

      // 2. 💡 ทำการ Insert โดยระบุ ID ที่ได้มาด้วยตัวเอง
      const { data, error } = await supabase
        .from("devices")
        .insert([{
          id: nextAvailableId, // 👈 ระบุ ID ที่ว่างที่หามาได้
          name: name,
          location: location,
          status: 'offline'
        }])
        .select();

      if (error) throw error;

      // อัปเดตข้อมูลหน้าจอ
      fetchDevices();
      alert(`Provision Success! Assigned ID: ${data[0].id}`);

    } catch (err) {
      console.error("Provisioning failed:", err);
      alert("Error: " + (err.message || "Cannot assign new ID"));
    }
  };

  // 4. ระบบนำทางและ Reset การปิดแจ้งเตือน
  const navigateTo = (targetView, device = null) => {
    setDismissedAlerts([]);
    setView(targetView);
    if (device) setActiveDevice(device);
    else if (targetView === "home") setActiveDevice(null);
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
      setDevices(prev => prev.map(d => d.id === deviceId && d.status === "offline" ? { ...d, status: "standby" } : d));
      setGlobalAlerts(prev => prev.filter(a => !(a.device_id === deviceId && a.metric === "status")));
    } catch {
      setPingResults(prev => ({ ...prev, [deviceId]: { loading: false, success: false, latency: 0, time: new Date() } }));
    }
  };

  useEffect(() => {
    devices.forEach(d => {
      if (d.status === "offline") {
        setGlobalAlerts(prev => {
          const exists = prev.find(a => a.device_id === d.id && a.metric === "status");
          if (!exists) {
            return [{ metric: "status", value: "DOWN", time: new Date().toISOString(), device_id: d.id }, ...prev].slice(0, 15);
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
              return { ...d, status, temperature: log.temperature, humidity: log.humidity, voltage: log.voltage, sound_db: log.sound_db, last_seen: log.created_at };
            }
            return d;
          })
        );
      })
      .subscribe();
    return () => supabase.removeChannel(globalChannel);
  }, [fetchDevices, calculateDeviceStatus]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigateTo("home");
  };

  if (!user) return <LoginView onLoginSuccess={(u) => setUser(u)} />;

  const activeAlerts = view === "analytics" ? localAlerts : globalAlerts;

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[#E2E8F0] dark:bg-[#0F172A] text-slate-800 dark:text-[#D0D2D6] transition-colors duration-300 font-sans">
        <Navbar
          darkMode={darkMode} setDarkMode={setDarkMode}
          onHomeClick={goHome} onSettingsClick={openSettings} onLogout={handleLogout}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {view === "home" && (
            <HomeView
              devices={devices || []}
              loading={loading}
              onNavigate={openAnalytics}
              pingResults={pingResults || {}}
              onPing={handleManualPing}
              // 💡 เปลี่ยนจากเปิด Settings ให้เป็นเปิดปอบอับแทน
              onAddClick={() => setIsAddModalOpen(true)}
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
            <SettingsView onBack={goHome} onRefreshConfig={fetchDevices} initialTab="devices" />
          )}
        </main>

        {/* 💡 วางคอมโพเนนต์ปอบอับไว้ที่นี่ */}
        <AddDeviceModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onConfirm={handleAddDevice}
        />

        <AlertPopup
          alerts={activeAlerts} devices={devices} view={view}
          dismissedAlerts={dismissedAlerts} setDismissedAlerts={setDismissedAlerts}
        />
      </div>
    </div>
  );
}