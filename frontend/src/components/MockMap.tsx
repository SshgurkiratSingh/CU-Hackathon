"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MockDevice } from "../lib/mock-data";

// --- Fix for Leaflet default icon issues in Webpack/Next.js ---
const fixLeafletIcons = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
};

interface MockMapProps {
  devices: MockDevice[];
}

const MockMap: React.FC<MockMapProps> = ({ devices }) => {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  return (
    <div
      className="h-full w-full rounded-lg overflow-hidden border border-gray-200"
      style={{ minHeight: "400px" }}
    >
      <MapContainer
        center={[51.505, -0.09]}
        zoom={13}
        style={{ height: "100%", width: "100%", minHeight: "400px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {devices.map((device) => (
          <Marker key={device.id} position={[device.lat, device.lng]}>
            <Popup>
              <div className="text-sm">
                <h3 className="font-bold text-gray-900">{device.name}</h3>
                <div className="mt-1 space-y-1">
                  <p>
                    Type: <span className="font-mono">{device.type}</span>
                  </p>
                  <p>Status: {device.status.toUpperCase()}</p>
                  <hr className="my-1" />
                  <p>Temp: {device.telemetry.temperature.toFixed(1)}°C</p>
                  <p>Battery: {device.telemetry.battery}%</p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MockMap;
