# MQTT Topic Data Upload Guide

This document defines how to publish sensor and device data to MQTT topics for Greenhouse OS.

## UI Reference


## 1) Topic Format

### Telemetry (recommended)

Topic:

`greenhouse/{siteId}/telemetry/{sensorType}/{nodeId}`

Examples:

- `greenhouse/zone-a/telemetry/temperature/sensor-001`
- `greenhouse/zone-a/telemetry/humidity/sensor-002`
- `greenhouse/zone-a/telemetry/soil_moisture/sensor-003`
- `greenhouse/zone-a/telemetry/co2/sensor-004`
- `greenhouse/zone-a/telemetry/light/sensor-005`

### Device status

Topic:

`greenhouse/{siteId}/devices/{deviceId}/status`

Example:

- `greenhouse/zone-a/devices/pump-001/status`

---

## 2) Telemetry Payload Format (JSON)

Required fields (recommended):

- `siteId` (string)
- `zoneId` (string)
- `nodeId` (string)
- `sensorType` (string)
- `value` (number)
- `unit` (string)
- `timestamp` (ISO 8601 string, UTC)

Optional fields:

- `quality` (number, 0-100)

Example payload:

```json
{
  "siteId": "zone-a",
  "zoneId": "zone-a",
  "nodeId": "sensor-001",
  "sensorType": "temperature",
  "value": 28.5,
  "unit": "°C",
  "quality": 100,
  "timestamp": "2026-02-17T12:00:00Z"
}
```

---

## 3) Publish Command Examples

### Single telemetry publish

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "greenhouse/zone-a/telemetry/temperature/sensor-001" \
  -m '{"siteId":"zone-a","zoneId":"zone-a","nodeId":"sensor-001","sensorType":"temperature","value":28.5,"unit":"°C","quality":100,"timestamp":"2026-02-17T12:00:00Z"}'
```

### Device status publish

```bash
mosquitto_pub -h localhost -p 1883 \
  -t "greenhouse/zone-a/devices/pump-001/status" \
  -m '{"deviceId":"pump-001","status":"running","uptime":3600,"lastHeartbeat":"2026-02-17T12:00:00Z","signalStrength":-45}'
```

---

## 4) Use the helper script

From project root:

```bash
# print topic/data list format only
./publish-mqtt.sh --list

# publish test payloads
./publish-mqtt.sh
```

---

## 5) Supported sensorType values (common)

- `temperature`
- `humidity`
- `soil_moisture`
- `co2`
- `light`
- `barometer`
- `mmwave_presence`
- `vpd`

Custom values are allowed if your frontend/device config maps them correctly.
