# MQTT Message Flow with Logging

## Architecture Overview

```
┌─────────────────┐
│   ESP32/IoT     │
│     Device      │
└────────┬────────┘
         │ Publishes to: gh/zone1/temp/s001
         │ Payload: {"value":25.5,"unit":"°C"}
         ▼
┌─────────────────────────────────────────────────────────┐
│                    MQTT Broker                          │
│                  (Mosquitto/HiveMQ)                     │
└────────┬────────────────────────────────────────────────┘
         │ Subscribed Topics:
         │ - # (all topics)
         ▼
┌─────────────────────────────────────────────────────────┐
│              Backend MQTT Client                        │
│              (backend/src/index.js)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Message Reception Handler                          │
│     ┌─────────────────────────────────────────┐       │
│     │ mqttClient.on("message", ...)           │       │
│     │                                         │       │
│     │ LOG: "MQTT message received"           │       │
│     │   - topic: "gh/zone1/temp/s001"        │       │
│     │   - payload: {"value":25.5}            │       │
│     │   - messageSize: 45                    │       │
│     └──────────────┬──────────────────────────┘       │
│                    ▼                                   │
│  2. Parse Message                                      │
│     ┌─────────────────────────────────────────┐       │
│     │ parseMqttMessage(message)               │       │
│     │ - Try JSON.parse()                      │       │
│     │ - Fallback to number                    │       │
│     │ - Fallback to string                    │       │
│     └──────────────┬──────────────────────────┘       │
│                    ▼                                   │
│  3. Store Telemetry                                    │
│     ┌─────────────────────────────────────────┐       │
│     │ storeTelemetryFromMqtt(topic, payload)  │       │
│     └──────────────┬──────────────────────────┘       │
│                    ▼                                   │
└────────────────────┼───────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│  Find Device    │    │   LOG: DEBUG    │
│  by Topic       │    │ "No device      │
│                 │    │  found"         │
└────────┬────────┘    └─────────────────┘
         │ Device Found
         ▼
┌─────────────────────────────────────────┐
│  Find Sensor by Topic                   │
│  - Match sensor.mqttTopic               │
└────────┬────────────────────────────────┘
         │ Sensor Found
         ▼
┌─────────────────────────────────────────┐
│  Validate Value                         │
│  - Check if numeric                     │
│  - LOG: WARN if invalid                 │
└────────┬────────────────────────────────┘
         │ Valid
         ▼
┌─────────────────────────────────────────┐
│  Create Telemetry Document              │
│  ┌───────────────────────────────────┐  │
│  │ Telemetry.create({                │  │
│  │   siteId: "zone1",                │  │
│  │   deviceId: "dev-123",            │  │
│  │   sensorKey: "temperature",       │  │
│  │   sensorType: "temperature",      │  │
│  │   value: 25.5,                    │  │
│  │   unit: "°C",                     │  │
│  │   topic: "gh/zone1/temp/s001",   │  │
│  │   timestamp: Date.now()           │  │
│  │ })                                │  │
│  └───────────────────────────────────┘  │
└────────┬────────────────────────────────┘
         │ Success
         ▼
┌─────────────────────────────────────────┐
│  LOG: INFO                              │
│  "MQTT telemetry stored successfully"   │
│  ┌───────────────────────────────────┐  │
│  │ - topic: "gh/zone1/temp/s001"    │  │
│  │ - deviceId: "dev-123"            │  │
│  │ - sensorKey: "temperature"       │  │
│  │ - sensorType: "temperature"      │  │
│  │ - value: 25.5                    │  │
│  │ - unit: "°C"                     │  │
│  │ - telemetryId: "507f1f77..."     │  │
│  └───────────────────────────────────┘  │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│         MongoDB Database                │
│  ┌───────────────────────────────────┐  │
│  │ Collection: telemetries           │  │
│  │ {                                 │  │
│  │   _id: "507f1f77...",            │  │
│  │   siteId: "zone1",               │  │
│  │   deviceId: "dev-123",           │  │
│  │   sensorKey: "temperature",      │  │
│  │   value: 25.5,                   │  │
│  │   unit: "°C",                    │  │
│  │   timestamp: ISODate(...)        │  │
│  │ }                                │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## Error Scenarios

### Scenario 1: Device Not Found
```
MQTT Message → Parse → Find Device ✗
                           │
                           ▼
                    LOG: DEBUG
                    "No device found for MQTT topic"
                    - topic: "gh/unknown/temp/s001"
                    - payload: {"value":25.5}
```

### Scenario 2: Sensor Not Found
```
MQTT Message → Parse → Find Device ✓ → Find Sensor ✗
                                           │
                                           ▼
                                    LOG: WARN
                                    "Sensor not found for topic"
                                    - topic: "gh/zone1/unknown/s001"
                                    - deviceId: "dev-123"
```

### Scenario 3: Invalid Value
```
MQTT Message → Parse → Find Device ✓ → Find Sensor ✓ → Validate ✗
                                                           │
                                                           ▼
                                                    LOG: WARN
                                                    "Invalid numeric value"
                                                    - topic: "gh/zone1/temp/s001"
                                                    - payload: {"value":"abc"}
```

### Scenario 4: Database Error
```
MQTT Message → Parse → Find Device ✓ → Find Sensor ✓ → Validate ✓ → Create ✗
                                                                        │
                                                                        ▼
                                                                 LOG: ERROR
                                                                 "Failed to persist"
                                                                 - error: "..."
                                                                 - stack: "..."
                                                                 - topic: "..."
                                                                 - payload: {...}
```

## Topic Subscription Flow

```
┌─────────────────────────────────────────┐
│     Backend Startup                     │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Connect to MongoDB                     │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Connect to MQTT Broker                 │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  subscribeConfiguredMqttTopics()        │
│  ┌───────────────────────────────────┐  │
│  │ Subscribe to all topics: #        │  │
│  └───────────────────────────────────┘  │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  LOG: INFO                              │
│  "MQTT subscribed to all topics (#)"    │
└─────────────────────────────────────────┘
```

## Log Output Timeline

```
[2026-02-16 10:00:00] INFO: MongoDB connected
[2026-02-16 10:00:01] INFO: MQTT connected
[2026-02-16 10:00:02] INFO: MQTT subscribed to all topics (#)

[2026-02-16 10:00:15] INFO: MQTT message received
                            topic: "gh/zone1/temp/s001"
                            payload: {"value":25.5,"unit":"°C"}
                            messageSize: 45

[2026-02-16 10:00:15] INFO: MQTT telemetry stored successfully
                            topic: "gh/zone1/temp/s001"
                            deviceId: "dev-123"
                            sensorKey: "temperature"
                            sensorType: "temperature"
                            value: 25.5
                            unit: "°C"
                            telemetryId: "507f1f77bcf86cd799439011"
```

## Benefits of Enhanced Logging

✅ **Complete Traceability**
- Every message is logged from reception to storage
- Easy to track message flow

✅ **Quick Debugging**
- Identify issues immediately
- Full context in logs

✅ **Performance Monitoring**
- Track message volume
- Identify slow operations

✅ **Audit Trail**
- Complete history of all messages
- MongoDB document IDs for verification

---

**See Also:**
- [MQTT Quick Reference](MQTT_QUICK_REFERENCE.md)
- [MQTT Topic Update](MQTT_TOPIC_UPDATE.md)
