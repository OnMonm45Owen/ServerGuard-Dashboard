import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ตรวจสอบค่าเบื้องต้นใน Console (เอาออกตอนใช้งานจริง)
console.log("Supabase URL Check:", supabaseUrl ? "Found" : "Missing");

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase Environment Variables. Check Vercel Settings!");
}

export const supabase = createClient(supabaseUrl, supabaseKey)