// นำเข้าไลบรารี dotenv เพื่ออ่านค่าจากไฟล์ .env
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import process from 'process';

// ดึงค่าจากตัวแปรสภาพแวดล้อม
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ ไม่พบ VITE_SUPABASE_URL หรือ VITE_SUPABASE_ANON_KEY กรุณาตรวจสอบไฟล์ .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const devices = ['DEV_01', 'DEV_02', 'DEV_03'];

console.log("🚀 เริ่มต้นการจำลองข้อมูลเซ็นเซอร์ ServerGuard Pro...");
console.log("💡 ระบบจะจำลองข้อมูล และมี Watcher ตรวจสอบอุปกรณ์ Offline อัตโนมัติ");

// ---------------------------------------------------------
// ส่วนที่ 1: ฟังก์ชันจำลองการส่งข้อมูล (ทำงานทุก 5 วินาที)
// ---------------------------------------------------------
const simulateData = async () => {
  setInterval(async () => {
    const randomDevice = devices[Math.floor(Math.random() * devices.length)];
    
    const isAlert = Math.random() > 0.95;     // โอกาส 15% ค่าเกินกำหนด
    const isPowerOutage = Math.random() > 0.99; // โอกาส 5% ไฟดับ (กระแสไฟเป็น 0)

    let payload;
    let currentStatus = 'online';

    if (isPowerOutage) {
      // 🔴 จำลองสถานการณ์ไฟดับ (current_amp = 0)
      payload = {
        device_id: randomDevice,
        temperature: 28.0,
        humidity: 50.0,
        current_amp: 0.0, // 💡 กระแสไฟเป็น 0
        noise_level: 30.0
      };
      currentStatus = 'offline'; // เปลี่ยนสถานะเป็น offline ทันที
    } else {
      // 🟢 สถานการณ์ปกติ หรือ อุณหภูมิเกิน
      payload = {
        device_id: randomDevice,
        temperature: +(isAlert ? (35 + Math.random() * 10) : (20 + Math.random() * 5)).toFixed(1),
        humidity: +(isAlert ? (80 + Math.random() * 15) : (40 + Math.random() * 20)).toFixed(1),
        current_amp: +(isAlert ? (9 + Math.random() * 3) : (3 + Math.random() * 3)).toFixed(1),
        noise_level: +(isAlert ? (85 + Math.random() * 15) : (50 + Math.random() * 15)).toFixed(1)
      };
    }

    // ส่งข้อมูล Log
    const { error: logError } = await supabase.from('sensor_logs').insert([payload]);
    
    // อัปเดต Status และ last_seen
    const { error: deviceError } = await supabase.from('devices')
      .update({ 
        last_seen: new Date().toISOString(),
        status: currentStatus
      })
      .eq('id', randomDevice);
    
    if (logError || deviceError) {
      console.error(`❌ [${randomDevice}] Error:`, (logError || deviceError).message);
    } else {
      if (isPowerOutage) {
        console.log(`🔌 [${randomDevice}] ระบบไฟขัดข้อง: Amp = 0A | Status: offline ❌`);
      } else {
        console.log(`✅ [${randomDevice}] ส่งข้อมูล: Temp ${payload.temperature}°C | Status: online ${isAlert ? '🔥 (ALERT!)' : ''}`);
      }
    }
  }, 10000);
};

// ---------------------------------------------------------
// ส่วนที่ 2: ฟังก์ชัน Watcher ตรวจจับอุปกรณ์ขาดการติดต่อ (ทำงานทุก 1 นาที)
// ---------------------------------------------------------
const checkOfflineDevices = async () => {
  setInterval(async () => {
    // ดึงเฉพาะอุปกรณ์ที่สถานะปัจจุบันเป็น 'online'
    const { data: onlineDevices, error } = await supabase
      .from('devices')
      .select('id, last_seen')
      .eq('status', 'online');

    if (error) {
      console.error("❌ [Watcher] Error fetching devices:", error.message);
      return;
    }

    const now = new Date();
    const TIMEOUT_MS = 5 * 60 * 1000; // 5 นาที (แปลงเป็นมิลลิวินาที)

    for (const device of onlineDevices) {
      const lastSeenDate = new Date(device.last_seen);
      
      // เช็คว่าเวลาปัจจุบัน ห่างจาก last_seen เกิน 5 นาทีหรือไม่
      if (now - lastSeenDate > TIMEOUT_MS) {
        // ถ้าเกิน ให้จับเปลี่ยนเป็น offline
        await supabase.from('devices')
          .update({ status: 'offline' })
          .eq('id', device.id);
        
        console.log(`⚠️ [Watcher] ตรวจพบ ${device.id} ขาดการติดต่อเกิน 5 นาที! ปรับสถานะเป็น 'offline' เรียบร้อย`);
      }
    }
  }, 60000); // 60000 ms = 1 นาที
};

// เริ่มรันทั้ง 2 ระบบพร้อมกัน
simulateData();
checkOfflineDevices();