import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record) {
      return new Response(JSON.stringify({ error: "No record found" }), { status: 400 });
    }

    // 💡 1. สร้าง Array เก็บสาเหตุของปัญหาที่ตรวจพบ
    const issues: string[] = [];

    // เช็คทีละเงื่อนไขและเก็บสาเหตุ (อ้างอิงจาก METRICS_CONFIG ของคุณ)
    if (record.temperature > 32) {
      issues.push("🔥 อุณหภูมิสูงเกินขีดจำกัด (> 32 °C) เสี่ยงต่อความร้อนสะสม");
    }
    if (record.humidity > 75) {
      issues.push("💦 ความชื้นสูงเกินขีดจำกัด (> 75 %) ระวังหยดน้ำเกาะอุปกรณ์");
    }
    if (record.current_amp === 0) {
      issues.push("🔌 ไฟฟ้าขัดข้อง หรือ อุปกรณ์ดับ (0 A)");
    } else if (record.current_amp > 8) {
      issues.push("⚡ กระแสไฟโหลดเกินขีดจำกัด (> 8 A) ระวังระบบไฟโอเวอร์โหลด");
    }
    if (record.noise_level > 80) {
      issues.push("🔊 ระดับเสียงดังผิดปกติ (> 80 dB) อาจมีบุคคลบุกรุกหรือพัดลมเซิร์ฟเวอร์ทำงานหนัก");
    }

    // ถ้าไม่มี Issue อะไรเลย ให้จบการทำงาน
    if (issues.length === 0) {
      return new Response(JSON.stringify({ message: "Status Normal. No alert sent." }), { status: 200 });
    }

    const channelAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    const targetUserId = Deno.env.get('LINE_TARGET_USER_ID');

    if (!channelAccessToken || !targetUserId) {
        throw new Error("LINE credentials missing in Supabase Secrets.");
    }

    // 💡 2. นำสาเหตุทั้งหมดมาต่อกันเป็นข้อความแบบ Bullet
    const issuesText = issues.map(issue => `- ${issue}`).join('\n');

    // 💡 3. นำข้อความสาเหตุ ไปแทรกในหน้าตาแจ้งเตือน
    const messageText = `
🚨 [ServerGuard Pro] แจ้งเตือนฉุกเฉิน! 🚨
📍 อุปกรณ์: ${record.device_id}

⚠️ สาเหตุที่แจ้งเตือน:
${issuesText}

📊 ข้อมูลปัจจุบัน:
🌡️ อุณหภูมิ: ${record.temperature} °C
💧 ความชื้น: ${record.humidity} %
⚡ กระแสไฟ: ${record.current_amp} A
🔊 เสียง: ${record.noise_level} dB
🕒 เวลา: ${new Date(record.created_at).toLocaleString('th-TH')}
    `.trim();

    // ยิง Request ไปที่ Messaging API
    const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify({
        to: targetUserId,
        messages: [{ type: 'text', text: messageText }]
      })
    });

    const lineData = await lineRes.json();

    if (!lineRes.ok) throw new Error(`LINE API Error: ${lineData.message}`);

    return new Response(
      JSON.stringify({ success: true, message: "LINE Alert Sent via Messaging API!" }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("❌ Edge Function Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});