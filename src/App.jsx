import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Thermometer, Droplets, Zap, Volume2, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from './components/StatCard';
import SensorChart from './components/SensorChart';
import ControlPanel from './components/ControlPanel';

// 1. ตั้งค่า Supabase (นำค่ามาจากหน้า Settings > API ใน Supabase Dashboard)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



function App() {
  const [data, setData] = useState([]);
  const [latest, setLatest] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA')); 
  // เปลี่ยนค่าเริ่มต้นเป็น 'all' เพื่อให้เปิดมาเห็นกราฟรวมทุกค่าก่อนเลย
  const [selectedMetric, setSelectedMetric] = useState('all');

  // 1. กำหนดเกณฑ์แจ้งเตือน (ตรงกับใน Edge Function ของคุณ)
  const alertThresholds = {
    temperature: 35,
    humidity: 70,
    current_amp: 10,
    noise_level: 80
  };

  // 2. ข้อมูลการแสดงผลของแต่ละกราฟ
  const metricConfigs = {
    temperature: { key: "temperature", name: "Temp (°C)", color: "#ef4444" },
    humidity: { key: "humidity", name: "Humidity (%)", color: "#3b82f6" },
    current_amp: { key: "current_amp", name: "Current (A)", color: "#eab308" },
    noise_level: { key: "noise_level", name: "Noise (dB)", color: "#8b5cf6" }
  };

  // จัดการว่ากราฟจะต้องแสดงกี่เส้น
  const metricsToRender = selectedMetric === 'all' 
    ? Object.values(metricConfigs) 
    : [metricConfigs[selectedMetric]];

  useEffect(() => {
    const fetchDataByDate = async () => {
      const startOfDay = new Date(`${selectedDate}T00:00:00+07:00`).toISOString();
      const endOfDay = new Date(`${selectedDate}T23:59:59+07:00`).toISOString();

      const { data: dayData, error } = await supabase
        .from('sensor_logs')
        .select('*')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching data:', error);
      } else if (dayData) {
        setData(dayData);
        setLatest(dayData.length > 0 ? dayData[dayData.length - 1] : null);
      }
    };

    fetchDataByDate();

    const subscription = supabase
      .channel('sensor_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_logs' }, (payload) => {
        const newData = payload.new;
        const newDateTh = new Date(newData.created_at).toLocaleString('en-CA', { timeZone: 'Asia/Bangkok' }).split(',')[0];
        
        if (newDateTh === selectedDate) {
          setLatest(newData);
          setData((prev) => [...(prev || []), newData]); 
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedDate]);

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <header className="mb-8 flex items-center gap-3 justify-center lg:justify-start">
          <Activity className="text-blue-600" size={32} />
          <h1 className="text-3xl font-bold text-gray-800">ServerGuard Dashboard</h1>
        </header>

        {/* ตัวเลขสถานะล่าสุด (Card) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Temperature" value={latest?.temperature || '-'} unit="°C" icon={Thermometer} color="#ef4444" threshold={alertThresholds.temperature} />
          <StatCard title="Humidity" value={latest?.humidity || '-'} unit="%" icon={Droplets} color="#3b82f6" threshold={alertThresholds.humidity} />
          <StatCard title="Current" value={latest?.current_amp || '-'} unit="A" icon={Zap} color="#eab308" threshold={alertThresholds.current_amp} />
          <StatCard title="Noise Level" value={latest?.noise_level || '-'} unit="dB" icon={Volume2} color="#8b5cf6" threshold={alertThresholds.noise_level} />
        </div>

        {/* กราฟ (อยู่ด้านบนเมนูควบคุม) */}
        <div className="mb-6">
          {data.length > 0 ? (
            <SensorChart 
              data={data} 
              title={selectedMetric === 'all' ? "All Sensors Trend" : `${metricConfigs[selectedMetric].name} Trend`} 
              metrics={metricsToRender} 
              thresholds={alertThresholds}
            />
          ) : (
            <div className="bg-white p-10 rounded-xl shadow-md text-center text-gray-500">
              ไม่มีข้อมูลเซ็นเซอร์สำหรับวันที่ {selectedDate}
            </div>
          )}
        </div>

        {/* แผงควบคุม (ย้ายมาไว้ข้างใต้กราฟแล้ว!) */}
        <ControlPanel 
          selectedDate={selectedDate} 
          onDateChange={setSelectedDate} 
          selectedMetric={selectedMetric} 
          onMetricChange={setSelectedMetric} 
        />

      </div>
    </div>
  );
}

export default App;