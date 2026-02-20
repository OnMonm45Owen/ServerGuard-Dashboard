import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SensorChart = ({ data, title, dataKey, color }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-6">{title}</h2>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            {/* ซ่อนแกน X ไว้เพื่อให้ดูสะอาดตา แต่ข้อมูลเวลาจะไปโผล่ใน Tooltip แทน */}
            <XAxis dataKey="created_at" hide />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip
              labelFormatter={(label) =>
                new Date(label).toLocaleTimeString("th-TH", {
                  timeZone: "Asia/Bangkok",
                })
              }
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SensorChart;