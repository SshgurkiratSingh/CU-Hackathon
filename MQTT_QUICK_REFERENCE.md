# MQTT Topic Quick Reference

## Topic Format

### New Format (Recommended)
```
gh/{zone}/{sensor}/{node}
```

### Examples
```
gh/greenhouse1/temp/s001        → Temperature sensor
gh/greenhouse1/humidity/s001    → Humidity sensor
gh/greenhouse1/co2/s002         → CO2 sensor
gh/zone_a/soil_moisture/s003    → Soil moisture
gh/lab/light/s004               → Light sensor
```

### Old Format (Still Supported)
```
greenhouse/{zone}/telemetry/{sensor}/{node}
```

## Topic Segments

| Segment | Description | Example | Rules |
|---------|-------------|---------|-------|
| `gh` | Prefix (greenhouse) | `gh` | Fixed |
| `{zone}` | Zone/Site ID | `greenhouse1`, `zone_a` | Lowercase, alphanumeric, underscores |
| `{sensor}` | Sensor type | `temp`, `humidity`, `co2` | Lowercase, alphanumeric, underscores |
| `{node}` | Node/Device ID | `s001`, `s123` | Lowercase, alphanumeric, underscores |

## Message Payload Format

### JSON Format (Recommended)
```json
{
  "value": 25.5,
  "unit": "°C",
  "sensorType": "temperature",
  "siteId": "greenhouse1",
  "timestamp": 1234567890
}
```

### Minimal Format
```json
{
  "value": 25.5
}
```

### Plain Number (Supported)
```
25.5
```

## Required Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `value` | ✅ Yes | Number | Sensor reading |
| `unit` | ⚠️ Optional | String | Unit of measurement (e.g., "°C", "%", "ppm") |
| `sensorType` | ⚠️ Optional | String | Type of sensor (auto-detected from device config) |
| `siteId` | ⚠️ Optional | String | Zone ID (auto-detected from device config) |
| `timestamp` | ⚠️ Optional | Number/String | Unix timestamp or ISO date (defaults to server time) |

## ESP32 Example

```cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* TOPIC_TEMP = "gh/greenhouse1/temp/s001";

bool publishTemperature(PubSubClient &client, float value) {
  char payload[128];
  snprintf(payload, sizeof(payload),
    "{\"value\":%.2f,\"unit\":\"°C\",\"sensorType\":\"temperature\"}",
    value
  );
  return client.publish(TOPIC_TEMP, payload);
}

void setup() {
  // ... WiFi and MQTT setup ...
}

void loop() {
  float temp = readTemperature();
  publishTemperature(mqttClient, temp);
  delay(5000);
}
```

## Testing with Mosquitto

### Publish Test Message
```bash
# Temperature
mosquitto_pub -h localhost -t "gh/greenhouse1/temp/s001" \
  -m '{"value":25.5,"unit":"°C"}'

# Humidity
mosquitto_pub -h localhost -t "gh/greenhouse1/humidity/s001" \
  -m '{"value":65.2,"unit":"%"}'

# CO2
mosquitto_pub -h localhost -t "gh/greenhouse1/co2/s002" \
  -m '{"value":450,"unit":"ppm"}'
```

### Subscribe to Topics
```bash
# Backend automatically subscribes to all topics (#)
# To monitor manually:
mosquitto_sub -h localhost -t "#"

# Specific zone
mosquitto_sub -h localhost -t "gh/greenhouse1/#"

# Specific sensor type
mosquitto_sub -h localhost -t "gh/+/temp/#"
```

## Wildcard Patterns

| Pattern | Matches | Example |
|---------|---------|---------|
| `gh/#` | All topics | All sensors in all zones |
| `gh/greenhouse1/#` | All in zone | All sensors in greenhouse1 |
| `gh/+/temp/#` | All temp sensors | Temperature in all zones |
| `gh/greenhouse1/+/s001` | All sensors on node | All sensor types from s001 |

## Backend Logging

### What Gets Logged

1. **Message Reception:**
   - Topic name
   - Payload content
   - Message size

2. **Telemetry Storage:**
   - Device ID
   - Sensor key
   - Sensor type
   - Value and unit
   - MongoDB document ID

3. **Errors:**
   - Missing device
   - Invalid sensor
   - Invalid value
   - Storage failures

### Log Levels

- `DEBUG` - No device found (expected for unknown topics)
- `INFO` - Successful operations
- `WARN` - Validation failures
- `ERROR` - Critical failures

## Common Issues

### Message Not Stored
**Symptom:** MQTT message received but not in database

**Check:**
1. Device exists in database
2. Sensor with matching `mqttTopic` exists
3. Payload contains valid numeric `value`
4. Check backend logs for errors

**Solution:**
```bash
# Verify device configuration
curl http://localhost:2500/api/devices

# Check telemetry
curl http://localhost:2500/api/telemetry?limit=10
```

### Topic Not Subscribed
**Symptom:** Messages not received by backend

**Check:**
1. Backend logs show "MQTT subscribed to all topics (#)"
2. MQTT broker is running
3. Network connectivity

**Solution:**
```bash
# Restart backend to re-subscribe
npm restart

# Check MQTT broker
mosquitto_sub -h localhost -t "#" -v
```

## Best Practices

1. **Use Short Node IDs:** `s001` instead of `sensor_1234567890`
2. **Normalize Names:** Lowercase, no spaces, use underscores
3. **Include Units:** Always send unit in payload
4. **Batch Updates:** Send multiple sensors from same node
5. **Error Handling:** Check publish return value
6. **Reconnection:** Implement MQTT reconnection logic
7. **QoS Level:** Use QoS 1 for important data

## Migration Checklist

- [ ] Update device configuration with new topics
- [ ] Export ESP32 code from device config UI
- [ ] Update ESP32 firmware with new topics
- [ ] Test with mosquitto_pub
- [ ] Verify in backend logs
- [ ] Check telemetry API
- [ ] Update documentation
- [ ] Remove old topic references

---

**Quick Links:**
- [Full Documentation](./MQTT_TOPIC_UPDATE.md)
- [API Reference](./docs/api/API.md)
- [Setup Guide](./docs/setup/SETUP.md)
