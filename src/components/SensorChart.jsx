import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';

// ฟังก์ชันสร้างจุดแจ้งเตือน (จุดจะกลายเป็นสีแดงถ้าค่าเกินเกณฑ์)
const AlertDot = (props) => {
  const { cx, cy, value, dataKey, thresholds } = props;
  const limit = thresholds[dataKey];
  
  // ถ้ามีค่าเกณฑ์ และค่าปัจจุบันสูงกว่าหรือเท่ากับเกณฑ์ ให้วาดจุดสีแดงใหญ่ๆ
  if (limit && value >= limit) {
    return <circle cx={cx} cy={cy} r={6} fill="#dc2626" stroke="white" strokeWidth={2} />;
  }
  return null; // ถ้าปกติ ไม่ต้องแสดงจุด
};

const SensorChart = ({ data, title, metrics, thresholds }) => {
  // ฟังก์ชันแปลงเวลาให้เป็นรูปแบบ ชม:นาที (เช่น 14:30)
  const formatTime = (timeStr) => {
    return new Date(timeStr).toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Bangkok'
    });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-xl font-semibold mb-6">{title}</h2>
      <div className="h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
            
            {/* แกน X แสดงเวลา เอียง 45 องศาเพื่อไม่ให้ทับกัน */}
            <XAxis 
              dataKey="created_at" 
              tickFormatter={formatTime} 
              angle={-45} 
              textAnchor="end"
              height={60}
              tick={{ fill: '#6b7280', fontSize: 12 }}
            />
            <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
            
            <Tooltip 
              labelFormatter={(label) => new Date(label).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok' })}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            
            {/* แสดงคำอธิบายสีของเส้นกราฟ */}
            <Legend verticalAlign="top" height={36}/>

            {/* วนลูปวาดเส้นกราฟตามค่าที่ส่งมา (ถ้ารวมทุกค่า ก็จะวาด 4 เส้น) */}
            {metrics.map((m) => (
              <Line 
                key={m.key}
                name={m.name}
                type="monotone" 
                dataKey={m.key} 
                stroke={m.color} 
                strokeWidth={2} 
                dot={<AlertDot thresholds={thresholds} />} 
                activeDot={{ r: 6 }}
                isAnimationActive={false} 
              />
            ))}

            {/* ถ้ารูปแบบกราฟแสดงแค่ค่าเดียว ให้ตีเส้นประแนวนอนสีแดงเพื่อบอกระดับเกณฑ์อันตราย */}
            {metrics.length === 1 && thresholds[metrics[0].key] && (
               <ReferenceLine 
                 y={thresholds[metrics[0].key]} 
                 stroke="#dc2626" 
                 strokeDasharray="4 4" 
                 label={{ position: 'insideTopLeft', value: 'Alert Limit', fill: '#dc2626', fontSize: 12 }} 
               />
            )}

          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SensorChart;