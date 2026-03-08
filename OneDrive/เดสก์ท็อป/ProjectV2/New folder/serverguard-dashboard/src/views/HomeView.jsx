import React from "react";
import DeviceCard from "../components/DeviceCard";

export default function HomeView({ devices, loading, onNavigate }) {
  if (loading) {
    return <div className="p-6">Loading Devices...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Device Dashboard</h2>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {devices.map(device => (
          <DeviceCard key={device.id} device={device} onOpen={onNavigate} />
        ))}
      </div>

    </div>
  );
}