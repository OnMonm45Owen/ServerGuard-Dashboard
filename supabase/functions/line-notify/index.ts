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

    // เช็คอุณหภูมิ
    if (record.temperature > 32) {
      issues.push("🔥 อุณหภูมิสูงเกินขีดจำกัด (> 32 °C) เสี่ยงต่อความร้อนสะสม");
    }

    // เช็คความชื้น (อัปเดต: เพิ่มการแจ้งเตือนทั้งสูงและต่ำ)
    if (record.humidity > 75) {
      issues.push("💦 ความชื้นสูงเกินขีดจำกัด (> 75 %) ระวังหยดน้ำเกาะอุปกรณ์");
    } else if (record.humidity < 30) {
      issues.push("🌵 ความชื้นต่ำเกินไป (< 30 %) ระวังไฟฟ้าสถิตทำความเสียหายอุปกรณ์");
    }

    // เช็คแรงดันไฟฟ้า (Voltage) แทนกระแสไฟเดิม
    if (record.voltage > 240) {
      issues.push("⚡ แรงดันไฟฟ้าสูงผิดปกติ (> 240 V)");
    } else if (record.voltage < 200 && record.voltage > 0) {
      issues.push("🔌 แรงดันไฟฟ้าตก (< 200 V)");
    }

    // เช็คระดับเสียงและความดังกระแทก
    if (record.sound_peak > 0.6) {
      issues.push("💥 แจ้งเตือนเสียงกระแทก! (Peak > 0.6)");
    }
    if (record.sound_db > 70) {
      issues.push("🔊 แจ้งเตือนเสียงดังผิดปกติ! (> 70 dB)");
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
⚡ แรงดันไฟ: ${record.voltage} V
🔊 ระดับเสียง: ${record.sound_db} dB
🕒 เวลา: ${new Date(record.created_at).toLocaleString('th-TH')}
    `.trim();

    // ยิง Request ไปที่ Messaging API ของ LINE
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