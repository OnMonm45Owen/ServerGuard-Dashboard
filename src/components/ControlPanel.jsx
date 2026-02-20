import React from 'react';
import { Calendar, Filter } from 'lucide-react';

const ControlPanel = ({ selectedDate, onDateChange, selectedMetric, onMetricChange }) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm mb-8 flex flex-wrap items-center gap-6 border border-gray-100">
      
      <div className="flex items-center gap-3">
        <Calendar className="text-gray-400" size={24} />
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-500 mb-1">Select Date</label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="h-10 w-px bg-gray-200 hidden md:block"></div>

      <div className="flex items-center gap-3">
        <Filter className="text-gray-400" size={24} />
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-500 mb-1">Chart Metric</label>
          <select 
            value={selectedMetric}
            onChange={(e) => onMetricChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {/* เพิ่มตัวเลือก "รวมทุกค่า" ไว้บนสุด */}
            <option value="all">รวมทุกค่า (All Metrics)</option>
            <option value="temperature">Temperature (°C)</option>
            <option value="humidity">Humidity (%)</option>
            <option value="current_amp">Current (A)</option>
            <option value="noise_level">Noise Level (dB)</option>
          </select>
        </div>
      </div>

    </div>
  );
};

export default ControlPanel;