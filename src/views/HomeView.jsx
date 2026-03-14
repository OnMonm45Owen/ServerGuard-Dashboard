// src/views/HomeView.jsx
import React from "react";
import DeviceCard from "../components/DeviceCard";

export default function HomeView({ devices, loading, onNavigate, onPing, pingResults, onAddClick }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-slate-900 dark:text-white font-black uppercase tracking-widest animate-pulse">
          Loading Infrastructure...
        </p>
      </div>
    );
  }

  // 💡 คำนวณตัวเลขสถิติใหม่
  const total = devices.length;
  const online = devices.filter(d => d.status === 'online').length;
  // Anomalies นับรวม Warning, Offline และ Disconnect (สถานะใหม่)
  const anomalies = devices.filter(d => ['warning', 'offline', 'disconnect'].includes(d.status)).length;

  return (
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* 🛠️ Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-3 h-10 bg-blue-600 dark:bg-indigo-500 rounded-full"></div>
          <div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">
              Device Dashboard
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-bold">
              Real-time monitoring and status management
            </p>
          </div>
        </div>

        <button
          onClick={onAddClick}
          className="
            bg-emerald-600 hover:bg-emerald-500 
            text-white px-8 py-4 rounded-2xl 
            font-black text-xs uppercase tracking-[0.15em] 
            shadow-[0_6px_0_0_#065f46] 
            hover:translate-y-1 hover:shadow-[0_2px_0_0_#065f46] 
            active:translate-y-2 active:shadow-none 
            transition-all duration-150
            flex items-center gap-2
          "
        >
          <span className="text-lg">+</span> Add New Node
        </button>
      </div>

      {/* 📊 ส่วนสถิติย้ายขึ้นมาด้านบน (ปรับดีไซน์ให้เข้ากับ Dark Mode) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="p-6 bg-white dark:bg-[#1e293b] border-2 border-slate-900 dark:border-slate-800 rounded-2xl flex justify-between items-center shadow-xl">
          <span className="font-black text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">Total Devices</span>
          <span className="text-4xl font-black text-slate-900 dark:text-white leading-none">{total}</span>
        </div>
        
        <div className="p-6 bg-white dark:bg-[#1e293b] border-2 border-slate-900 dark:border-slate-800 rounded-2xl flex justify-between items-center shadow-xl">
          <span className="font-black text-[10px] text-emerald-600 uppercase tracking-[0.2em]">Active Online</span>
          <span className="text-4xl font-black text-emerald-600 leading-none">{online}</span>
        </div>
        
        {/* เน้นขอบแดงสำหรับส่วนที่มีปัญหา */}
        <div className="p-6 bg-white dark:bg-[#1e293b] border-2 border-slate-900 dark:border-slate-800 rounded-2xl flex justify-between items-center shadow-xl border-r-[8px] border-r-rose-600">
          <span className="font-black text-[10px] text-rose-600 uppercase tracking-[0.2em]">Anomalies</span>
          <span className="text-4xl font-black text-rose-600 leading-none">{anomalies}</span>
        </div>
      </div>
      
      {/* 💡 Grid Layout สำหรับแสดง Device Cards */}
      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {devices.length > 0 ? (
          devices.map(device => (
            <DeviceCard 
              key={device.id} 
              device={device} 
              onOpen={onNavigate} 
              onPing={onPing}
              pingResult={pingResults ? pingResults[device.id] : null}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white dark:bg-[#1e293b] rounded-[2.5rem] border-4 border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest">
              No Devices Detected in Network
            </p>
          </div>
        )}
      </div>
    </div>
  );
}