import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req: Request) => {
  try {
    const { record } = await req.json();
    let alertMessage = "";

    // 1. ตรวจสอบอุณหภูมิ (ค่าเดิม > 35°C)
    if (record.temperature > 35) {
      alertMessage += `🔥 อุณหภูมิสูง: ${record.temperature}°C\n`;
    }

    // 2. ตรวจสอบความชื้น (ปกติควรอยู่ 40-60%)
    if (record.humidity > 70) {
      alertMessage += `💧 ความชื้นสูงเกินไป: ${record.humidity}%\n`;
    } else if (record.humidity < 30) {
      alertMessage += `🌵 ความชื้นต่ำเกินไป: ${record.humidity}%\n`;
    }

    // 3. ตรวจสอบกระแสไฟฟ้า (Overload > 10A)
    if (record.current_amp > 10) {
      alertMessage += `⚡ กระแสไฟฟ้าเกิน: ${record.current_amp}A (อันตราย!)\n`;
    }

    // 4. ตรวจสอบระดับเสียง (ดังผิดปกติ > 80 dB)
    if (record.noise_level > 80) {
      alertMessage += `🔊 เสียงดังผิดปกติ: ${record.noise_level} dB\n`;
    }

    if (alertMessage) {
      const token = Deno.env.get('LINE_ACCESS_TOKEN');
      const fullMessage = `⚠️ [ServerGuard Alert]\n${alertMessage}เวลา: ${new Date(record.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`;
      
      await fetch('https://api.line.me/v2/bot/message/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [{ type: 'text', text: fullMessage }],
        }),
      });
    }

    return new Response(JSON.stringify({ status: "ok" }), { headers: { "Content-Type": "application/json" } });
  } catch (error: unknown) {
    return new Response(error.message, { status: 500 });
  }
})