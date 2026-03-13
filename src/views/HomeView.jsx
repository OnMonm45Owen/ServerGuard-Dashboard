// src/views/HomeView.jsx
import React from "react";
import DeviceCard from "../components/DeviceCard";

export default function HomeView({ devices, loading, onNavigate }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        {/* 💡 Loading State ที่ดูดีขึ้น */}
        <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest animate-pulse">
          Loading Devices...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 💡 ส่วนหัว Dashboard: ปรับให้หนาและคมชัดที่สุด */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-3 h-10 bg-blue-600 dark:bg-indigo-500 rounded-full"></div>
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
            Device Dashboard
          </h2>
          <p className="text-slate-600 dark:text-slate-400 font-bold">
            Real-time monitoring and status management
          </p>
        </div>
      </div>
      
      {/* 💡 Grid Layout: ปรับระยะห่างให้ดูไม่อึดอัด */}
      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {devices.length > 0 ? (
          devices.map(device => (
            <DeviceCard 
              key={device.id} 
              device={device} 
              onOpen={onNavigate} 
            />
          ))
        ) : (
          /* 💡 กรณีไม่มีอุปกรณ์ในระบบ */
          <div className="col-span-full py-20 text-center bg-white dark:bg-[#1e293b] rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
              No Devices Detected in Network
            </p>
          </div>
        )}
      </div>

      {/* 💡 ส่วนสถิติย่อด้านล่าง (Optional) เพื่อเพิ่มความเต็มของหน้าจอ */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-4 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex justify-between items-center">
          <span className="font-black text-xs text-slate-500 uppercase">Total Devices</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{devices.length}</span>
        </div>
        <div className="p-4 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex justify-between items-center">
          <span className="font-black text-xs text-slate-500 uppercase">Online</span>
          <span className="text-2xl font-black text-emerald-600">{devices.filter(d => d.status === 'online').length}</span>
        </div>
        <div className="p-4 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex justify-between items-center">
          <span className="font-black text-xs text-slate-500 uppercase">Alerts</span>
          <span className="text-2xl font-black text-rose-600">{devices.filter(d => d.status === 'warning').length}</span>
        </div>
      </div>
    </div>
  );
}