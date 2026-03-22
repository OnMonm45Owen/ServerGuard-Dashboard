// src/App.jsx
import React, { useEffect, useState, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomeView from "./views/HomeView";
import AnalyticsView from "./views/AnalyticsView";
import SettingsView from "./views/SettingsView";
import LoginView from "./views/LoginView";
import AlertPopup from "./components/AlertPopup";
import AddDeviceModal from "./components/AddDeviceModal";
import useSensorData from "./hooks/useSensorData";
import { supabase } from "./lib/supabase";

// 💡 สร้าง MainApp Component เพื่อให้สามารถเรียกใช้ useNavigate() ได้
function MainApp() {
  const [user, setUser] = useState(null);
  const [devices, setDevices] = useState([]);
  const [metric, setMetric] = useState("temperature");
  const [timeRange, setTimeRange] = useState("24h");
  const [date, setDate] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [globalAlerts, setGlobalAlerts] = useState([]);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [pingResults, setPingResults] = useState({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [metricsConfig, setMetricsConfig] = useState({});

  // 💡 1. ใช้งาน React Router Hooks
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';

  // 💡 2. ดึงรหัสอุปกรณ์จาก URL (ถ้ากำลังอยู่หน้า Analytics)
  const activeDeviceId = location.pathname.startsWith('/analytics/') ? location.pathname.split('/')[2] : null;
  const activeDevice = devices.find(d => String(d.id) === String(activeDeviceId));

  const fetchConfig = useCallback(async () => {
    const { data, error } = await supabase.from("metrics_settings").select("*");
    if (!error && data) {
      const configMap = data.reduce((acc, curr) => {
        acc[curr.id] = curr;
        return acc;
      }, {});
      setMetricsConfig(configMap);
      return configMap;
    }
    return {};
  }, []);

  const checkActiveWarning = useCallback((deviceId, latestLog, currentConfig) => {
    if (!latestLog || !currentConfig || Object.keys(currentConfig).length === 0) return false;
    return Object.keys(currentConfig).some((m) => {
      const conf = currentConfig[m];
      const val = latestLog[m];
      if (!conf || val === null || val === undefined || conf.is_multi_line) return false;

      const isExceeded = (conf.threshold !== null && val > conf.threshold) || 
                         (conf.threshold_min !== null && val < conf.threshold_min);

      if (isExceeded) {
        const alertKey = `${deviceId}-${latestLog.created_at}-${m}`;
        return !dismissedAlerts.includes(alertKey);
      }
      return false;
    });
  }, [dismissedAlerts]);

  const calculateDeviceStatus = useCallback((deviceId, latestLog, currentConfig) => {
    const TIMEOUT_MS = 300 * 1000; 
    const ping = pingResults[deviceId];
    const lastSeen = latestLog ? new Date(latestLog.created_at).getTime() : 0;
    const isDataActive = (Date.now() - lastSeen) < TIMEOUT_MS;

    if (isDataActive && ping && ping.success === false) return "disconnect";
    if (isDataActive) return checkActiveWarning(deviceId, latestLog, currentConfig) ? "warning" : "online";
    if (ping?.success) return "standby";
    
    return "offline";
  }, [pingResults, checkActiveWarning]);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    const currentConfig = await fetchConfig();

    const { data: devicesData, error: devError } = await supabase.from("devices").select("*").order('id');
    if (devError) {
      console.error("Error fetching devices:", devError);
      setLoading(false);
      return;
    }

    const initialAlerts = [];
    const devicesWithLogs = await Promise.all(
      devicesData.map(async (device) => {
        const { data: logs } = await supabase.from("sensor_logs").select("*").eq("device_id", device.id).order("created_at", { ascending: false }).limit(1);
        const latestLog = logs && logs.length > 0 ? logs[0] : null;
        const currentStatus = calculateDeviceStatus(device.id, latestLog, currentConfig);

        if (latestLog && (currentStatus === "online" || currentStatus === "warning")) {
          Object.keys(currentConfig).forEach((m) => {
            const val = latestLog[m];
            const conf = currentConfig[m];
            if (conf && !conf.is_multi_line && val !== undefined && val !== null) {
                const isOverMax = conf.threshold !== null && val > conf.threshold;
                const isUnderMin = conf.threshold_min !== null && val < conf.threshold_min;
                if (isOverMax || isUnderMin) {
                    initialAlerts.push({ metric: m, value: val, time: latestLog.created_at, device_id: device.id });
                }
            }
          });
        }

        return { ...device, status: currentStatus, ...latestLog, id: device.id, last_seen: latestLog?.created_at ?? null };
      })
    );

    setGlobalAlerts(initialAlerts.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15));
    setDevices(devicesWithLogs);
    setLoading(false);
  }, [calculateDeviceStatus, fetchConfig]);

  const handleAddDevice = async (name, location) => {
    try {
      const { data: nextAvailableId, error: rpcError } = await supabase.rpc('get_available_device_id');
      if (rpcError) throw rpcError;

      const { data, error } = await supabase.from("devices").insert([{ id: nextAvailableId, name, location, status: 'offline' }]).select();
      if (error) throw error;
      
      fetchDevices();
      alert(`Provision Success! Assigned ID: ${data[0].id}`);
      setIsAddModalOpen(false);
    } catch (err) {
      alert("Error: " + (err.message || "Cannot assign new ID"));
    }
  };

  // 💡 3. สร้างระบบนำทาง (Navigation) ด้วย React Router
  const goHome = () => {
    setDismissedAlerts([]);
    navigate("/");
  };
  const openAnalytics = (device) => {
    setDismissedAlerts([]);
    navigate(`/analytics/${device.id}`);
  };
  const openSettings = () => {
    if (!isAdmin) return alert("Access Denied: Requires Administrator Privileges.");
    setDismissedAlerts([]);
    navigate("/settings");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const { history, alerts: localAlerts } = useSensorData(activeDeviceId, date, timeRange, metricsConfig);

  const handleManualPing = async (deviceId, ipAddress) => {
    if (!ipAddress) return alert("No IP/URL configured for this device.");
    setPingResults(prev => ({ ...prev, [deviceId]: { loading: true } }));
    const startTime = Date.now();
    const targetUrl = ipAddress.startsWith('http') ? ipAddress : `http://${ipAddress}`;

    try {
      await fetch(targetUrl, { mode: 'no-cors', cache: 'no-cache' });
      setPingResults(prev => ({ ...prev, [deviceId]: { loading: false, success: true, latency: Date.now() - startTime, time: new Date() } }));
      fetchDevices();
    } catch {
      setPingResults(prev => ({ ...prev, [deviceId]: { loading: false, success: false, latency: 0, time: new Date() } }));
    }
  };

  useEffect(() => {
    fetchDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!metricsConfig || Object.keys(metricsConfig).length === 0) return;
    const globalChannel = supabase.channel("global-sensor-stream")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sensor_logs" }, (payload) => {
        const log = payload.new;
        setDevices((prevDevices) =>
          prevDevices.map((d) => {
            if (d.id === log.device_id) {
              const status = calculateDeviceStatus(log.device_id, log, metricsConfig);
              return { ...d, ...log, id: d.id, status, last_seen: log.created_at };
            }
            return d;
          })
        );
      }).subscribe();
    return () => supabase.removeChannel(globalChannel);
  }, [calculateDeviceStatus, metricsConfig]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate("/");
  };

  if (!user) return <LoginView onLoginSuccess={(u) => setUser(u)} />;

  const activeAlerts = location.pathname.startsWith('/analytics') ? localAlerts : globalAlerts;

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-[#E2E8F0] dark:bg-[#0F172A] text-slate-800 dark:text-[#D0D2D6] transition-colors duration-300 font-sans">
        <Navbar
          darkMode={darkMode} setDarkMode={setDarkMode}
          onHomeClick={goHome} onSettingsClick={openSettings} onLogout={handleLogout}
          isAdmin={isAdmin}
          user={user} 
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 💡 4. โครงสร้าง Routes */}
          <Routes>
            {/* หน้า Home */}
            <Route path="/" element={
              <HomeView
                devices={devices || []}
                loading={loading}
                onNavigate={openAnalytics}
                pingResults={pingResults || {}}
                onPing={handleManualPing}
                onAddClick={() => setIsAddModalOpen(true)}
                metricsConfig={metricsConfig}
                isAdmin={isAdmin}
              />
            } />

            {/* หน้า Analytics (ดึง ID ผ่านพารามิเตอร์ URL) */}
            <Route path="/analytics/:id" element={
              loading ? (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                  <div className="w-12 h-12 border-4 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest animate-pulse">Loading Node Data...</p>
                </div>
              ) : activeDevice ? (
                <AnalyticsView
                  device={activeDevice} history={history} activeMetric={metric} onMetricChange={setMetric}
                  timeRange={timeRange} setTimeRange={setTimeRange} selectedDate={date} setSelectedDate={setDate}
                  alerts={localAlerts} onBack={goHome} darkMode={darkMode} 
                  metricsConfig={metricsConfig}
                />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tighter">Device Not Found</h2>
                  <button onClick={goHome} className="mt-6 text-indigo-500 font-bold underline uppercase">Return to Dashboard</button>
                </div>
              )
            } />

            {/* หน้า Settings (มีการ์ดป้องกัน (Guard) ไม่ให้ Guest แอบเข้ามาทาง URL ได้) */}
            <Route path="/settings" element={
              isAdmin ? (
                <SettingsView onBack={() => { fetchDevices(); goHome(); }} onRefreshConfig={fetchDevices} initialTab="devices" />
              ) : (
                <Navigate to="/" replace /> // เด้งกลับหน้าโฮมถ้าพยายามพิมพ์ /settings
              )
            } />

            {/* กรณีพิมพ์ URL มั่ว */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <AddDeviceModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onConfirm={handleAddDevice} />
        <AlertPopup alerts={activeAlerts} devices={devices} view={location.pathname === "/" ? "home" : "analytics"} dismissedAlerts={dismissedAlerts} setDismissedAlerts={setDismissedAlerts} config={metricsConfig} />
      </div>
    </div>
  );
}

// 💡 5. ครอบ App ทั้งหมดด้วย BrowserRouter
export default function AppWrapper() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}