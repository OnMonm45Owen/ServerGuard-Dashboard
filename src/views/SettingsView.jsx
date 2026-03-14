// src/views/SettingsView.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function SettingsView({ onBack, onRefreshConfig }) {
    const [settings, setSettings] = useState([]); // สำหรับ metrics_settings
    const [devices, setDevices] = useState([]);   // สำหรับ devices (IP Address)
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [savedSuccess, setSavedSuccess] = useState(null);
    const [fetchError, setFetchError] = useState(null);

    // 💡 ฟังก์ชันดึงข้อมูลจากทั้ง 2 ตารางพร้อมกัน
    const fetchData = async () => {
        setLoading(true);
        setFetchError(null);
        
        try {
            const [metricsRes, devicesRes] = await Promise.all([
                supabase.from("metrics_settings").select("*").order("id"),
                supabase.from("devices").select("*").order("id")
            ]);

            if (metricsRes.error) throw metricsRes.error;
            if (devicesRes.error) throw devicesRes.error;

            setSettings(metricsRes.data || []);
            setDevices(devicesRes.data || []);
        } catch (error) {
            setFetchError("Failed to synchronize with database.");
            console.error("Fetch error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- ⚙️ Logic สำหรับ Sensor Thresholds ---
    const handleUpdate = (id, field, value) => {
        setSettings(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const saveToDb = async (setting) => {
        setSaving(setting.id);
        const parsedThreshold = setting.threshold === "" ? 0 : parseFloat(setting.threshold);
        const parsedThresholdMin = setting.threshold_min === "" ? null : parseFloat(setting.threshold_min);

        const { error } = await supabase
            .from("metrics_settings")
            .update({ threshold: parsedThreshold, threshold_min: parsedThresholdMin })
            .eq("id", setting.id);

        if (!error) {
            setSavedSuccess(setting.id);
            if (onRefreshConfig) onRefreshConfig();
            setTimeout(() => setSavedSuccess(null), 2000);
        } else {
            alert(`Failed to save ${setting.label}`);
        }
        setSaving(null);
    };

    // --- 🌐 Logic สำหรับ Device Connectivity (IP/URL) ---
    const handleDeviceUpdate = (id, value) => {
        setDevices(prev => prev.map(d => d.id === id ? { ...d, ip_address: value } : d));
    };

    const saveDeviceIp = async (device) => {
        setSaving(`dev-${device.id}`);
        const { error } = await supabase
            .from("devices")
            .update({ ip_address: device.ip_address })
            .eq("id", device.id);

        if (!error) {
            setSavedSuccess(`dev-${device.id}`);
            setTimeout(() => setSavedSuccess(null), 2000);
        } else {
            alert(`Failed to update IP for ${device.name}`);
        }
        setSaving(null);
    };

    // 💡 แก้ไข ESLint Error: ตรวจสอบและแสดงผล fetchError
    if (fetchError) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-6 text-center">
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center text-4xl animate-bounce">
                ⚠️
            </div>
            <div>
                <h3 className="text-2xl font-black text-rose-600 uppercase tracking-tighter">
                    Synchronization Failed
                </h3>
                <p className="text-slate-500 font-bold text-sm mt-2 max-w-xs mx-auto">
                    {fetchError}
                </p>
            </div>
            <button 
                onClick={() => window.location.reload()} 
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase border-b-4 border-rose-500 active:translate-y-1 active:border-none transition-all"
            >
                Retry Connection
            </button>
        </div>
    );

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="text-xl font-black animate-pulse text-slate-400 uppercase tracking-widest">Accessing System Core...</div>
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto animate-in fade-in zoom-in duration-500 pb-20">

            {/* 🛠️ Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
                <div className="flex items-center gap-4">
                    <div className="w-4 h-12 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
                    <div>
                        <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
                            Control <span className="text-indigo-600">Center</span>
                        </h2>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2 italic">Infrastructure Configuration</p>
                    </div>
                </div>
                <button
                    onClick={onBack}
                    className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-2 border-transparent px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95 border-b-4 border-b-indigo-500 dark:border-b-indigo-300"
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* 🌐 Section 1: Device Connectivity (รองรับทั้ง IP และ URL) */}
            <div className="mb-16">
                <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 uppercase mb-6 flex items-center gap-3">
                    <span className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">🌐</span>
                    Device Ping Targets
                </h3>
                <div className="grid gap-6">
                    {devices.map((dev) => (
                        <div key={dev.id} className="bg-white dark:bg-[#1e293b] border-2 border-slate-300 dark:border-slate-700 p-6 rounded-[2rem] flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-indigo-500 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-900 dark:bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg">🖥️</div>
                                <div>
                                    <h4 className="font-black text-slate-900 dark:text-white uppercase text-xl tracking-tighter">{dev.name}</h4>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {dev.id}</span>
                                </div>
                            </div>

                            <div className="flex-1 max-w-2xl flex flex-col md:flex-row items-end gap-4">
                                <div className="flex-1 w-full flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Target IP or URL</span>
                                    <input
                                        type="text"
                                        value={dev.ip_address || ""}
                                        onChange={(e) => handleDeviceUpdate(dev.id, e.target.value)}
                                        placeholder="e.g. 192.168.1.50 or myserver.com"
                                        className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-slate-700 rounded-xl font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500 shadow-inner"
                                    />
                                    <p className="text-[9px] text-slate-400 mt-1 ml-2 font-bold uppercase tracking-tighter">*รองรับทั้งเลข IP และเว็บไซต์ URL โดยตรง</p>
                                </div>
                                <button
                                    onClick={() => saveDeviceIp(dev)}
                                    disabled={saving === `dev-${dev.id}`}
                                    className={`
                                        px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all min-w-[140px]
                                        ${savedSuccess === `dev-${dev.id}`
                                            ? "bg-emerald-500 text-white shadow-[0_4px_0_0_#065f46] translate-y-[4px]"
                                            : saving === `dev-${dev.id}`
                                                ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                                                : "bg-slate-900 dark:bg-indigo-600 text-white shadow-[0_6px_0_0_#000] dark:shadow-[0_6px_0_0_#312e81] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none"
                                        }
                                    `}
                                >
                                    {savedSuccess === `dev-${dev.id}` ? "✓ Saved" : saving === `dev-${dev.id}` ? "Syncing..." : "Push IP"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ⚠️ Section 2: Global Thresholds (Sensor Calibration) */}
            <div>
                <h3 className="text-xl font-black text-rose-600 uppercase mb-6 flex items-center gap-3">
                    <span className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg">⚠️</span>
                    Sensor Calibration
                </h3>
                <div className="grid gap-8">
                    {settings.map((item) => (
                        <div key={item.id} className="group bg-white dark:bg-[#1e293b] border-2 border-slate-300 dark:border-slate-600 rounded-[2.5rem] p-8 shadow-md flex flex-col xl:flex-row xl:items-center justify-between gap-8 hover:border-indigo-500 transition-all duration-300">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-[2rem] border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-4xl bg-slate-50 dark:bg-[#0f172a]" style={{ borderColor: item.color + '66' }}>
                                    <span style={{ color: item.color }} className="drop-shadow-md">
                                        {item.id === 'ping' ? '📡' : '⚡'}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 dark:text-white uppercase text-3xl leading-none mb-2 tracking-tighter">{item.label}</h4>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black bg-slate-900 text-white dark:bg-indigo-600 px-3 py-1 rounded-lg uppercase">ID: {item.id}</span>
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Unit: {item.unit}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-end gap-6 bg-slate-50 dark:bg-[#0f172a]/50 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                                {item.threshold_min !== null && (
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-2">Min Limit</span>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={item.threshold_min}
                                            onChange={(e) => handleUpdate(item.id, 'threshold_min', e.target.value)}
                                            className="w-32 p-4 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-center text-2xl text-rose-600 outline-none focus:border-rose-500"
                                        />
                                    </div>
                                )}
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-2">
                                        {item.id === 'ping' ? 'Timeout (ms)' : 'Max Limit'}
                                    </span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={item.threshold}
                                        onChange={(e) => handleUpdate(item.id, 'threshold', e.target.value)}
                                        className="w-32 p-4 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-center text-2xl text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <button
                                    onClick={() => saveToDb(item)}
                                    disabled={saving === item.id}
                                    className={`w-36 px-4 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all
                                        ${savedSuccess === item.id 
                                            ? "bg-emerald-500 text-white shadow-[0_4px_0_0_#065f46] translate-y-[4px]" 
                                            : saving === item.id 
                                                ? "bg-slate-300 text-slate-500 cursor-not-allowed" 
                                                : "bg-indigo-600 text-white shadow-[0_8px_0_0_#312e81] hover:shadow-[0_4px_0_0_#312e81] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] active:bg-indigo-700"
                                        }
                                    `}
                                >
                                    {savedSuccess === item.id ? "✓ Saved" : saving === item.id ? "Syncing..." : "Push Config"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-16 py-10 border-t-2 border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">
                    ServerGuard Pro • Infrastructure Protection System
                </p>
            </div>
        </div>
    );
}