import React from "react";
import { METRICS_CONFIG } from "../utils/metricsConfig";

export default function MetricSelector({
  activeMetric,
  onChange,
}) {
  return (
    <div className="flex gap-3 mt-4 flex-wrap">

      {Object.keys(METRICS_CONFIG).map((metric) => {

        const active = metric === activeMetric;

        return (
          <button
            key={metric}
            onClick={() => onChange(metric)}
            className={`px-4 py-2 rounded-lg text-sm ${
              active
                ? "bg-blue-600 text-white"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            {METRICS_CONFIG[metric].label}
          </button>
        );
      })}
    </div>
  );
}