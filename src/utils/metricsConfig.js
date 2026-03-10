export const METRICS_CONFIG = {
  temperature: {
    label: "Temperature",
    unit: "°C",
    color: "#ef4444",
    threshold: 32
  },
  humidity: {
    label: "Humidity",
    unit: "%",
    color: "#3b82f6",
    threshold: 75,    // ค่าสูงสุดที่ยอมรับได้
    thresholdMin: 30  // เพิ่ม: ค่าต่ำสุดที่ยอมรับได้ (ป้องกันไฟฟ้าสถิต)
  },
  voltage: {
    label: "Voltage",
    unit: "V",
    color: "#f59e0b",
    threshold: 240
  },
  sound_db: {
    label: "Sound Level",
    unit: "dB",
    color: "#a855f7",
    threshold: 70
  },
  sound_analysis: {
    label: "Sound Analysis (RMS vs Peak)",
    unit: "lvl",
    isMultiLine: true,
    metrics: [
      { key: "sound_rms", label: "RMS", color: "#10b981" },
      { key: "sound_peak", label: "Peak", color: "#f97316", threshold: 0.6 }
    ]
  }
};