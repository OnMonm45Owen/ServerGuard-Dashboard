import React from 'react';

const StatCard = ({ title, value, unit, icon: Icon, color }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h3 className="text-2xl font-bold mt-1">
            {value} <span className="text-lg font-normal">{unit}</span>
          </h3>
        </div>
        {/* เช็คว่ามี Icon ถูกส่งมาไหม ก่อนนำไปแสดงผล */}
        {Icon && <Icon size={32} className="opacity-80" style={{ color }} />}
      </div>
    </div>
  );
};

export default StatCard;