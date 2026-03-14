// supabase/functions/telegram-alert/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// 🔒 ดึงกุญแจความลับ
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')

// กำหนด Interface สำหรับความปลอดภัยของข้อมูล
interface MetricSetting {
  id: string;
  label: string;
  unit: string;
  threshold?: number;
  threshold_min?: number;
}

serve(async (req: Request) => { // 💡 ระบุประเภท Request
  try {
    const payload = await req.json()
    const { record } = payload

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: device } = await supabase
      .from('devices')
      .select('name, location')
      .eq('id', record.device_id)
      .single()

    const { data: settings } = await supabase
      .from('metrics_settings')
      .select('*')

    // 💡 ระบุว่า alerts เป็น Array ของ string
    const alerts: string[] = []

    // ⚖️ ระบุ Type ให้ conf เป็น MetricSetting
    (settings as MetricSetting[] | null)?.forEach((conf) => {
      const val = record[conf.id]
      if (val === null || val === undefined) return
      
      if (conf.threshold && val > conf.threshold) {
        alerts.push(`🚨 <b>${conf.label} High:</b> ${val.toFixed(1)}${conf.unit} (Limit: ${conf.threshold})`)
      }
      if (conf.threshold_min && val < conf.threshold_min) {
        alerts.push(`🚨 <b>${conf.label} Low:</b> ${val.toFixed(1)}${conf.unit} (Limit: ${conf.threshold_min})`)
      }
    })

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
          parse_mode: 'HTML'
        })
      })
    }

    return new Response(JSON.stringify({ message: "Processed" }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err: any) { // 💡 ระบุประเภท err เป็น any หรือใช้ Error instance
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})