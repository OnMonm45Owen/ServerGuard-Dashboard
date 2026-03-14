// supabase/functions/telegram-alert/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// 🔒 ดึงกุญแจความลับจาก Secrets ที่เราตั้งไว้
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')

serve(async (req) => {
  try {
    // 📩 รับ Payload จาก Database Webhook
    const payload = await req.json()
    const { record } = payload // ข้อมูลใหม่ในตาราง sensor_logs

    // 🛠️ เริ่มต้นการเชื่อมต่อ Supabase ภายใน Function
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // ใช้ Service Role เพื่อข้าม RLS
    )

    // 🔍 ดึงข้อมูลชื่อเครื่องและสถานที่ (ดึงจากตาราง devices)
    const { data: device } = await supabase
      .from('devices')
      .select('name, location')
      .eq('id', record.device_id)
      .single()

    // 🔍 ดึงเกณฑ์การแจ้งเตือนปัจจุบัน (ดึงจากตาราง metrics_settings)
    const { data: settings } = await supabase
      .from('metrics_settings')
      .select('*')

    let alerts = []

    // ⚖️ ลอจิกตรวจสอบความผิดปกติ: เทียบค่าจริงกับ Threshold
    settings?.forEach(conf => {
      const val = record[conf.id]
      if (val === null || val === undefined) return
      
      // กรณีค่าสูงเกินไป
      if (conf.threshold && val > conf.threshold) {
        alerts.push(`🚨 <b>${conf.label} High:</b> ${val.toFixed(1)}${conf.unit} (Limit: ${conf.threshold})`)
      }
      // กรณีค่าต่ำเกินไป (ถ้ามี)
      if (conf.threshold_min && val < conf.threshold_min) {
        alerts.push(`🚨 <b>${conf.label} Low:</b> ${val.toFixed(1)}${conf.unit} (Limit: ${conf.threshold_min})`)
      }
    })

    // 🚀 ถ้าตรวจพบความผิดปกติ... ส่ง Telegram ทันที!
    if (alerts.length > 0) {
      const message = [
        `⚠️ <b>SERVERGUARD SECURITY ALERT</b>`,
        `--------------------------`,
        `🆔 <b>Node:</b> ${record.device_id}`,
        `🖥️ <b>Device:</b> ${device?.name || 'Unknown'}`,
        `📍 <b>Location:</b> ${device?.location || 'N/A'}`,
        `--------------------------`,
        ...alerts,
        `\n⏰ <i>Sent: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</i>`
      ].join('\n')

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML' // ช่วยให้ส่งตัวหนา/ตัวเอียงได้สวยงาม
        })
      })
    }

    return new Response(JSON.stringify({ message: "Processed" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})