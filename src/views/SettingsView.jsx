// src/views/SettingsView.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function SettingsView({ onBack, onRefreshConfig, initialTab = "devices" }) {
    const [activeTab, setActiveTab] = useState(initialTab); // 'devices' หรือ 'sensors'
    const [settings, setSettings] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [savedSuccess, setSavedSuccess] = useState(null);
    const [fetchError, setFetchError] = useState(null);

    const [newDevice, setNewDevice] = useState({ name: "", location: "" });

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

    useEffect(() => { fetchData(); }, []);

    // 🆕 ฟังก์ชันเพิ่มอุปกรณ์ใหม่
    const handleAddDevice = async () => {
        if (!newDevice.name || !newDevice.location) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
        setSaving("adding");

        const { error } = await supabase
            .from("devices")
            .insert([{ 
                name: newDevice.name, 
                location: newDevice.location,
                status: 'offline'
            }]);

        if (!error) {
            setSavedSuccess("adding");
            setNewDevice({ name: "", location: "" });
            fetchData();
            if (onRefreshConfig) onRefreshConfig();
            setTimeout(() => setSavedSuccess(null), 2000);
        } else {
            alert("Error adding device: " + error.message);
        }
        setSaving(null);
    };

    // ⚙️ ฟังก์ชันบันทึกการแก้ไขอุปกรณ์
    const saveDeviceData = async (device) => {
        setSaving(`dev-${device.id}`);
        const { error } = await supabase
            .from("devices")
            .update({ 
                name: device.name, 
                location: device.location,
                ip_address: device.ip_address 
            })
            .eq("id", device.id);

        if (!error) {
            setSavedSuccess(`dev-${device.id}`);
            if (onRefreshConfig) onRefreshConfig();
            setTimeout(() => setSavedSuccess(null), 2000);
        }
        setSaving(null);
    };

    // 🗑️ ฟังก์ชันลบอุปกรณ์
    const handleDeleteDevice = async (deviceId, deviceName) => {
        if (!window.confirm(`⚠️ ยืนยันการลบเครื่อง "${deviceName}"?\nข้อมูล Logs ทั้งหมดของเครื่องนี้จะหายไป`)) return;
        
        setSaving(`del-${deviceId}`);
        const { error } = await supabase.from("devices").delete().eq("id", deviceId);

        if (!error) {
            setDevices(prev => prev.filter(d => d.id !== deviceId));
            if (onRefreshConfig) onRefreshConfig();
        } else {
            alert("Delete failed: " + error.message);
        }
        setSaving(null);
    };

    const handleDeviceFieldUpdate = (id, field, value) => {
        setDevices(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const handleUpdate = (id, field, value) => {
        setSettings(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const saveToDb = async (setting) => {
        setSaving(setting.id);
        const parsedThreshold = setting.threshold === "" ? 0 : parseFloat(setting.threshold);
        const parsedThresholdMin = setting.threshold_min === "" ? null : parseFloat(setting.threshold_min);
        const { error } = await supabase.from("metrics_settings").update({ threshold: parsedThreshold, threshold_min: parsedThresholdMin }).eq("id", setting.id);
        if (!error) {
            setSavedSuccess(setting.id);
            if (onRefreshConfig) onRefreshConfig();
            setTimeout(() => setSavedSuccess(null), 2000);
        }
        setSaving(null);
    };

    if (fetchError) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-6 text-center">
            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center text-4xl animate-bounce">⚠️</div>
            <h3 className="text-2xl font-black text-rose-600 uppercase tracking-tighter">Synchronization Failed</h3>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase border-b-4 border-rose-500">Retry Connection</button>
        </div>
    );

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-slate-400 font-black animate-pulse">
            LOADING SYSTEM CORE...
        </div>
    );

    return (
        <div className="p-6 max-w-5xl mx-auto animate-in fade-in zoom-in duration-500 pb-20">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-12">
                <div>
                    <h2 className="text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Control <span className="text-indigo-600">Center</span></h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2 italic">Infrastructure Configuration</p>
                </div>
                <button onClick={onBack} className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-2 border-transparent px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95 border-b-4 border-b-indigo-500">← Back</button>
            </div>

            {/* 💡 Tab Selector */}
            <div className="flex gap-2 p-1.5 bg-slate-200 dark:bg-slate-800 rounded-2xl mb-12 border-2 border-slate-300 dark:border-slate-700">
                <button 
                    onClick={() => setActiveTab("devices")}
                    className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'devices' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    🖥️ Device Management
                </button>
                <button 
                    onClick={() => setActiveTab("sensors")}
                    className={`flex-1 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'sensors' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    ⚠️ Sensor Calibration
                </button>
            </div>

            {activeTab === "devices" ? (
                <div className="animate-in slide-in-from-left-4 duration-300">
                    {/* ⚙️ รายการเครื่องที่มีอยู่ */}
                    <div className="grid gap-6">
                        {devices.map((dev) => (
                            <div key={dev.id} className="bg-white dark:bg-[#1e293b] border-2 border-slate-300 dark:border-slate-700 p-6 rounded-[2rem] flex flex-col gap-6 hover:border-indigo-500 transition-all shadow-md">
                                <div className="flex justify-between items-center border-b-2 border-slate-100 dark:border-slate-800 pb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-slate-900 dark:bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">{dev.id.slice(-2)}</div>
                                        <h4 className="font-black text-slate-900 dark:text-white text-xl uppercase tracking-tighter">{dev.id}</h4>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleDeleteDevice(dev.id, dev.name)}
                                            className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all border-2 border-transparent hover:border-rose-700"
                                        >
                                            🗑️
                                        </button>
                                        <button onClick={() => saveDeviceData(dev)} className={`px-6 py-2 rounded-lg font-black text-[10px] uppercase transition-all ${savedSuccess === `dev-${dev.id}` ? "bg-emerald-500 text-white" : "bg-slate-900 text-white"}`}>
                                            {savedSuccess === `dev-${dev.id}` ? "Saved" : "Push Changes"}
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Name</span>
                                        <input type="text" value={dev.name} onChange={(e) => handleDeviceFieldUpdate(dev.id, 'name', e.target.value)} className="p-3 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-slate-700 rounded-xl font-black text-xs dark:text-white outline-none focus:border-indigo-500" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Location</span>
                                        <input type="text" value={dev.location} onChange={(e) => handleDeviceFieldUpdate(dev.id, 'location', e.target.value)} className="p-3 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-slate-700 rounded-xl font-black text-xs dark:text-white outline-none focus:border-indigo-500" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-slate-400 uppercase ml-1">IP / URL Address</span>
                                        <input type="text" value={dev.ip_address || ""} onChange={(e) => handleDeviceFieldUpdate(dev.id, 'ip_address', e.target.value)} className="p-3 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-slate-700 rounded-xl font-black text-xs dark:text-white outline-none focus:border-indigo-500" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="animate-in slide-in-from-right-4 duration-300 grid gap-8">
                    {settings.map((item) => (
                        <div key={item.id} className="group bg-white dark:bg-[#1e293b] border-2 border-slate-300 dark:border-slate-600 rounded-[2.5rem] p-8 flex flex-col xl:flex-row xl:items-center justify-between gap-8 hover:border-indigo-500 transition-all duration-300 shadow-md">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-[2rem] border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-4xl bg-slate-50 dark:bg-[#0f172a]" style={{ borderColor: item.color + '66' }}>
                                    <span style={{ color: item.color }}>{item.id === 'ping' ? '📡' : '⚡'}</span>
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 dark:text-white uppercase text-3xl leading-none tracking-tighter">{item.label}</h4>
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Unit: {item.unit}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-end gap-6 bg-slate-50 dark:bg-[#0f172a]/50 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800">
                                {item.threshold_min !== null && (
                                    <div className="flex flex-col gap-2">
                                        <span className="text-[10px] font-black text-rose-500 uppercase ml-2">Min Limit</span>
                                        <input type="number" step="0.1" value={item.threshold_min} onChange={(e) => handleUpdate(item.id, 'threshold_min', e.target.value)} className="w-32 p-4 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-center text-2xl text-rose-600 outline-none focus:border-rose-500" />
                                    </div>
                                )}
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-amber-500 uppercase ml-2">{item.id === 'ping' ? 'Timeout (ms)' : 'Max Limit'}</span>
                                    <input type="number" step="0.1" value={item.threshold} onChange={(e) => handleUpdate(item.id, 'threshold', e.target.value)} className="w-32 p-4 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-center text-2xl text-slate-900 dark:text-white outline-none focus:border-indigo-500" />
                                </div>
                                <button onClick={() => saveToDb(item)} disabled={saving === item.id} className={`w-36 px-4 py-5 rounded-2xl font-black text-xs uppercase transition-all ${savedSuccess === item.id ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white shadow-[0_8px_0_0_#312e81] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px]"}`}>
                                    {savedSuccess === item.id ? "✓ Saved" : "Push Config"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-16 py-10 border-t-2 border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">ServerGuard Pro • Infrastructure Protection System</p>
            </div>
        </div>
    );
}