import React from "react";

export default function TimeRangeSelector({ range, setRange, date, setDate }) {
  // 💡 เอา "12m" ออกเหลือแค่ 3 อัน
  const ranges = ["24h", "7d", "30d"];

  return (
    <div className="flex flex-wrap gap-4 mb-4 items-center">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="border px-3 py-2 rounded dark:bg-slate-800"
      />
      <div className="flex gap-2">
        {ranges.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-2 rounded ${
              r === range ? "bg-blue-600 text-white" : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}