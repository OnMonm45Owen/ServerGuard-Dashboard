# 🛡️ ServerGuard Monitoring System

ระบบตรวจวัดสภาพแวดล้อมภายในห้องเซิร์ฟเวอร์แบบ Real-time โดยใช้ ESP32 และ Dashboard จัดการข้อมูล

## 🚀 Overview
**ServerGuard** คือโปรเจกต์ IoT ที่ช่วยเฝ้าระวังความปลอดภัยของอุปกรณ์เซิร์ฟเวอร์ โดยเน้นการวัดอุณหภูมิ, ความชื้น, แรงดันไฟฟ้า และตรวจจับเสียงผิดปกติ เพื่อป้องกันความเสียหายก่อนเกิดเหตุ

### Key Features
* **Real-time Dashboard:** แสดงผลข้อมูลผ่าน React และ Tailwind CSS
* **Multi-Sensor Support:** * 🌡️ **BME280:** วัดอุณหภูมิและความชื้นแม่นยำสูง
    * ⚡ **ZMPT101B:** ตรวจวัดแรงดันไฟฟ้า (Voltage)
    * 🎤 **INMP441:** ตรวจจับระดับเสียงในห้อง
* **Cloud Integration:** บันทึกข้อมูลและจัดการ Auth ด้วย **Supabase**
* **Dark/Light Mode:** รองรับการปรับเปลี่ยนธีมตามความต้องการ

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** React + Vite
* **Styling:** Tailwind CSS
* **Icons:** Lucide React / React Icons

### Backend & Database
* **Database:** Supabase (PostgreSQL)
* **Real-time:** Supabase Realtime Subscriptions

### Hardware (IoT)
* **Microcontroller:** ESP32
* **Communication:** WiFi (HTTP / MQTT / Supabase REST API)

---

## 📸 Screenshots
| Desktop Dashboard | Mobile View |
|---|---|
| ![Dashboard Link](https://via.placeholder.com/400x250) | ![Mobile Link](https://via.placeholder.com/200x400) |

---

## ⚙️ Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/OnMonm45Owen/ServerGuard-Dashboard.git](https://github.com/OnMonm45Owen/ServerGuard-Dashboard.git)
    cd serverguard-dashboard
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Variables:** สร้างไฟล์ `.env` และใส่ค่าของคุณ:
    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
4.  **Run Development Server:**
    ```bash
    npm run dev
    ```

---

## 📝 Authors
* **Pinmanat Paiboon** - *Lead Developer* - [OnMonm45Owen](https://github.com/OnMonm45Owen)
