import React, { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      onLoginSuccess(data.user);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#0f172a] p-6 font-sans">
      <div className="w-full max-w-md bg-white dark:bg-[#1e293b] rounded-[2.5rem] border-4 border-slate-900 dark:border-slate-700 shadow-[20px_20px_0_0_rgba(0,0,0,0.1)] dark:shadow-[20px_20px_0_0_rgba(0,0,0,0.3)] p-10 transform transition-all">
        
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex w-20 h-20 bg-slate-900 dark:bg-indigo-600 rounded-3xl items-center justify-center text-4xl shadow-xl border-4 border-slate-700 dark:border-indigo-400 mb-6 animate-bounce">
            🛡️
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
            ServerGuard <span className="text-blue-600 dark:text-indigo-400">Pro</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-[0.2em] mt-2">
            Secure Infrastructure Access
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-100 border-2 border-rose-500 rounded-xl text-rose-700 text-xs font-black uppercase text-center animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-900 dark:text-white outline-none focus:border-blue-600 dark:focus:border-indigo-500 transition-all shadow-inner"
              placeholder="admin@serverguard.pro"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Security Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-900 dark:text-white outline-none focus:border-blue-600 dark:focus:border-indigo-500 transition-all shadow-inner"
              placeholder="••••••••"
            />
          </div>

          {/* Login Button - สไตล์ปุ่มกดที่ยุบได้ (3D) */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full 
              bg-slate-900 dark:bg-indigo-600 
              text-white py-5 rounded-2xl 
              font-black text-sm uppercase tracking-[0.2em]
              shadow-[0_6px_0_0_rgba(0,0,0,1)] dark:shadow-[0_6px_0_0_rgba(49,46,129,1)]
              hover:shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:translate-y-[2px]
              active:shadow-none active:translate-y-[6px]
              transition-all duration-100
              disabled:opacity-50 disabled:pointer-events-none
              mt-4
            "
          >
            {loading ? "Authenticating..." : "Establish Connection ➔"}
          </button>
        </form>

        <div className="mt-10 text-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            System Status: <span className="text-emerald-500">Encrypted & Ready</span>
          </span>
        </div>
      </div>
    </div>
  );
}
