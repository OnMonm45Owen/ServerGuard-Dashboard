// src/components/AddDeviceModal.jsx
import React, { useState } from "react";

export default function AddDeviceModal({ isOpen, onClose, onConfirm }) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!name || !location) return alert("Please fill in all fields");
    setIsSaving(true);
    await onConfirm(name, location);
    setIsSaving(false);
    setName("");
    setLocation("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop: พื้นหลังเบลอ */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-[#1e293b] border-4 border-slate-900 dark:border-slate-700 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              Provision <span className="text-emerald-600">Node</span>
            </h3>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Add New Infrastructure Node</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-rose-600 transition-colors font-black text-2xl">✕</button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Device Name</span>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Server Room A"
              className="p-4 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all shadow-inner"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Installation Location</span>
            <input 
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Floor 2, Building B"
              className="p-4 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-all shadow-inner"
            />
          </div>

          {/* Action Button */}
          <button 
            onClick={handleConfirm}
            disabled={isSaving}
            className="
              w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all
              bg-slate-900 dark:bg-emerald-600 text-white 
              shadow-[0_6px_0_0_#000] dark:shadow-[0_6px_0_0_#064e3b]
              hover:translate-y-1 hover:shadow-[0_2px_0_0_#000]
              active:translate-y-2 active:shadow-none
              flex items-center justify-center gap-3
            "
          >
            {isSaving ? (
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : "Confirm Provisioning"}
          </button>
        </div>
      </div>
    </div>
  );
}