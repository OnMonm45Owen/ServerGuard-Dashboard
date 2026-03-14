import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

const devices = ['DEV_01', 'DEV_02', 'DEV_03']

// state ของ device
const state = {}

devices.forEach(d => {
  state[d] = {
    load: Math.random() * 40,
    temp: 25,
    humidity: 50,
    voltage: 220,
    sound: 45,
    heatWave: false,
    voltageDrop: false
  }
})

console.log("🚀 ServerGuard Simulator Started")

function drift(value, min, max, step) {

  value += (Math.random() * 2 - 1) * step

  if (value < min) value = min
  if (value > max) value = max

  return value
}

setInterval(async () => {

  const device = devices[Math.floor(Math.random() * devices.length)]
  const s = state[device]

  // 📊 server load change
  s.load = drift(s.load, 10, 100, 8)

  // 🔊 fan noise จาก load
  s.sound = 35 + s.load * 0.45 + (Math.random() * 2)

  // 🌡 heat wave event
  if (Math.random() < 0.03) s.heatWave = true
  if (Math.random() < 0.05) s.heatWave = false

  if (s.heatWave) {
    s.temp += 0.8
  } else {
    s.temp = drift(s.temp, 22, 32, 0.4)
  }

  // ⚡ voltage drop event
  if (Math.random() < 0.02) s.voltageDrop = true
  if (Math.random() < 0.05) s.voltageDrop = false

  if (s.voltageDrop) {
    s.voltage = drift(s.voltage, 150, 180, 3)
  } else {
    s.voltage = drift(s.voltage, 215, 230, 1)
  }

  // humidity drift
  s.humidity = drift(s.humidity, 40, 70, 1.5)

  const payload = {

    device_id: device,

    temperature: +s.temp.toFixed(2),
    humidity: +s.humidity.toFixed(2),
    voltage: +s.voltage.toFixed(2),
    sound_db: +s.sound.toFixed(2)

  }

  const { error } = await supabase
    .from('sensor_logs')
    .insert([payload])

  if (error) {
    console.log("❌ Error:", error.message)
  } else {

    console.log(`
📡 ${device}
Load: ${s.load.toFixed(0)}%
Temp: ${payload.temperature} °C
Hum : ${payload.humidity} %
Volt: ${payload.voltage} V
Sound:${payload.sound_db} dB
`)

  }

}, 5000)