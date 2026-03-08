import React, { useEffect, useState } from "react";
import { METRICS_CONFIG } from "../utils/metricsConfig";

export default function AlertPopup({ alerts, devices = [], view = "home" }) {
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  
  // 💡 แก้ไข: ใช้ฟังก์ชัน () => Date.now() เพื่อให้ React เรียกใช้เฉพาะตอนสร้าง Component ครั้งแรกเท่านั้น
  // วิธีนี้จะผ่านกฎ react-hooks/purity ครับ
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!alerts || alerts.length === 0) return null;

  const activeAlerts = alerts.filter(alert => {
    const alertTime = new Date(alert.time).getTime();
    const diffInMinutes = (currentTime - alertTime) / 60000;
    
    const isFresh = diffInMinutes <= 10;
    const alertKey = `${alert.device_id}-${alert.time}-${alert.metric}`;
    const isDismissed = dismissedAlerts.includes(alertKey);
    
    return isFresh && !isDismissed;
  });

  if (activeAlerts.length === 0) return null;

  const handleClose = (alert) => {
    const alertKey = `${alert.device_id}-${alert.time}-${alert.metric}`;
    setDismissedAlerts(prev => [...prev, alertKey]);
  };

  const isHome = view === "home";
  const positionClasses = isHome 
    ? "bottom-5 left-1/2 -translate-x-1/2 flex-row overflow-x-auto max-w-[95vw] px-2 pb-4 pt-2 snap-x" 
    : "top-20 right-5 flex-col items-end overflow-y-auto max-h-[85vh] pr-2";

  return (
    <div className={`fixed ${positionClasses} flex gap-4 z-50 pointer-events-none`}>
      {activeAlerts.map((alert, index) => {
        const config = METRICS_CONFIG[alert.metric];
        const targetDevice = devices.find((d) => d.id === alert.device_id);
        const deviceName = targetDevice ? targetDevice.name : "Unknown Device";

        return (
          <div 
            key={`${alert.device_id}-${alert.time}-${index}`} 
            className="pointer-events-auto bg-red-600 text-white p-5 rounded-xl shadow-2xl border-t-4 border-red-900 animate-bounce min-w-[280px] sm:min-w-[300px] flex-shrink-0 snap-center"
          >
            <div className="flex justify-between items-center border-b border-red-500/50 pb-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div className="font-bold text-lg uppercase">System Alert</div>
              </div>
              <button onClick={() => handleClose(alert)} className="text-white hover:text-red-200 font-bold text-xl">✕</button>
            </div>
            <div className="text-md font-medium text-red-100 mb-1">
              Location: <span className="text-white font-bold">{deviceName}</span>
            </div>
            <div className="flex justify-between items-end mt-2">
              <div>
                <div className="text-sm text-red-200">{config?.label} Limit</div>
                <div className="text-3xl font-black">{alert.value} <span className="text-lg">{config?.unit}</span></div>
              </div>
              <div className="text-xs font-medium bg-red-800/50 px-2 py-1 rounded-md">
                {new Date(alert.time).toLocaleTimeString('th-TH')}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}