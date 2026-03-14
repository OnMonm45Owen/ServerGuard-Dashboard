// src/views/SettingsView.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function SettingsView({ onBack, onRefreshConfig }) {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(null);
    const [savedSuccess, setSavedSuccess] = useState(null); // เพิ่ม State บอกสถานะสำเร็จ
    const [fetchError, setFetchError] = useState(null);

    const fetchSettings = async () => {
        setLoading(true);
        setFetchError(null);
        const { data, error } = await supabase.from("metrics_settings").select("*").order("id");
        
        if (error) {
            setFetchError("Failed to fetch configurations.");
        } else if (data) {
            setSettings(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleUpdate = (id, field, value) => {
        // ให้ผู้ใช้พิมพ์ค่าเป็น String ได้อิสระ (ไม่บังคับเป็น 0 ทันทีถ้าลบหมด)
        setSettings(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const saveToDb = async (setting) => {
        setSaving(setting.id);
        
        // แปลงค่ากลับเป็นตัวเลขก่อนบันทึกลง DB (ถ้าว่างให้เป็น 0)
        const parsedThreshold = setting.threshold === "" ? 0 : parseFloat(setting.threshold);
        const parsedThresholdMin = setting.threshold_min === "" ? null : parseFloat(setting.threshold_min);

        const { error } = await supabase
            .from("metrics_settings")
            .update({
                threshold: parsedThreshold,
                threshold_min: parsedThresholdMin
            })
            .eq("id", setting.id);

        if (!error) {
            console.log(`Update ${setting.label} Success`);
            setSavedSuccess(setting.id); // กำหนดสถานะสำเร็จ
            
            if (onRefreshConfig) onRefreshConfig();
            
            // แสดงสถานะ Saved 2 วินาที
            setTimeout(() => {
                setSavedSuccess(null);
            }, 2000);
        } else {
            console.error("Save error:", error);
            alert(`Failed to save ${setting.label}`);
        }
        
        setSaving(null);
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="text-xl font-black animate-pulse text-slate-400 uppercase tracking-widest">
                Accessing Global Config...
            </div>
        </div>
    );

    if (fetchError) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
            <div className="text-xl font-black text-rose-500 uppercase tracking-widest text-center">
                ⚠️ Connection Error <br/><span className="text-sm font-medium text-slate-500">{fetchError}</span>
            </div>
            <button onClick={fetchSettings} className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold">Retry</button>
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
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2 italic">Threshold & System Calibration</p>
                    </div>
                </div>
                <button
                    onClick={onBack}
                    className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-2 border-transparent px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl active:scale-95 border-b-4 border-b-indigo-500 dark:border-b-indigo-300"
                >
                    ← Back to Dashboard
                </button>
            </div>

            {/* ⚙️ Settings Grid */}
            <div className="grid gap-8">
                {settings.map((item) => (
                    <div
                        key={item.id}
                        className="group bg-white dark:bg-[#1e293b] border-2 border-slate-300 dark:border-slate-600 rounded-[2.5rem] p-8 shadow-md flex flex-col xl:flex-row xl:items-center justify-between gap-8 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-300"
                    >
                        {/* Metric Identity */}
                        <div className="flex items-center gap-6">
                            <div
                                className="w-20 h-20 rounded-[2rem] border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-4xl bg-slate-50 dark:bg-[#0f172a] shadow-inner group-hover:rotate-6 transition-transform"
                                style={{ borderColor: item.color + '66' }}
                            >
                                <span style={{ color: item.color }} className="drop-shadow-md">
                                    {item.id === 'ping' ? '📡' : '⚡'}
                                </span>
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 dark:text-white uppercase text-3xl leading-none mb-2 tracking-tighter">
                                    {item.label}
                                </h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black bg-slate-900 text-white dark:bg-indigo-600 px-3 py-1 rounded-lg uppercase tracking-widest">
                                        ID: {item.id}
                                    </span>
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Standard Unit: {item.unit}</span>
                                </div>
                            </div>
                        </div>

                        {/* Calibration Console */}
                        <div className="flex flex-wrap items-end gap-6 bg-slate-50 dark:bg-[#0f172a]/50 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-inner">

                            {item.threshold_min !== null && item.threshold_min !== undefined && (
                                <div className="flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] ml-2">Min Threshold</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={item.threshold_min}
                                        onChange={(e) => handleUpdate(item.id, 'threshold_min', e.target.value)}
                                        className="w-32 p-4 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-center text-2xl text-rose-600 outline-none focus:border-rose-500 shadow-sm transition-all"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] ml-2">
                                    {item.id === 'ping' ? 'Timeout (ms)' : 'Max Threshold'}
                                </span>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={item.threshold}
                                    onChange={(e) => handleUpdate(item.id, 'threshold', e.target.value)}
                                    className="w-32 p-4 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-center text-2xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 shadow-sm transition-all"
                                />
                            </div>

                            <button
                                onClick={() => saveToDb(item)}
                                disabled={saving === item.id}
                                className={`
                                    w-36 px-4 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-2
                                    ${savedSuccess === item.id 
                                        ? "bg-emerald-500 text-white shadow-[0_4px_0_0_#047857] translate-y-[4px]" // สถานะบันทึกสำเร็จ
                                        : saving === item.id
                                            ? "bg-slate-300 text-slate-500 cursor-not-allowed scale-95" // สถานะกำลังบันทึก
                                            : "bg-indigo-600 text-white shadow-[0_8px_0_0_#312e81] hover:shadow-[0_4px_0_0_#312e81] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] active:bg-indigo-700" // สถานะปกติ
                                    }
                                `}
                            >
                                {savedSuccess === item.id ? (
                                    <><span>✅</span> Saved</>
                                ) : saving === item.id ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div> Syncing
                                    </>
                                ) : (
                                    "Push Config"
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-16 py-10 border-t-2 border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">
                    ServerGuard Pro • Infrastructure Protection System
                </p>
            </div>
        </div>
    );
}