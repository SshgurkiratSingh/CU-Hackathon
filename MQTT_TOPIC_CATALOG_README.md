# MQTT Topic Catalog (Telemetry, Actuators, AI, Alerts)

This document provides a single reference for topic groups used across the project, including **general topics** and feature-specific topics.

## 1) General Topics (Recommended Baseline)

Use these for platform-level observability and operations:

- `greenhouse/system/health`
  - Service health updates (backend, gateway, worker status)
- `greenhouse/system/heartbeat`
  - Lightweight periodic heartbeat/presence
- `greenhouse/system/logs`
  - General system events/log forwarding
- `greenhouse/system/metrics`
  - Aggregated runtime metrics (CPU/memory/message rates)

### Example payload

```json
{
  "service": "backend",
  "status": "healthy",
  "timestamp": "2026-02-18T12:00:00.000Z"
}
```

---

## 2) Telemetry Topics

### Current short-format telemetry

- `gh/{zone}/{sensor}/{node}`
  - Example: `gh/zone-1/temperature/node-007`

### Optional grouped telemetry

- `greenhouse/telemetry/{siteId}`

### Telemetry payload (server stores receive timestamp)

```json
{
  "siteId": "zone-1",
  "sensorType": "temperature",
  "value": 27.4,
  "unit": "C"
}
```

---

## 3) Actuator Command Topics

### Device actuator command topic

- `greenhouse/{siteId}/command/{actuatorType}/{deviceId}`
  - Example: `greenhouse/zone-1/command/fan_pwm/fan-ctrl-1`

### Manual trigger endpoint

- `POST /api/devices/:id/actuators/:sensorKey/trigger`

### Actuator payload

```json
{
  "type": "actuator_command",
  "command": "set",
  "value": 75,
  "siteId": "zone-1",
  "deviceId": "fan-ctrl-1",
  "sensorKey": "fan_pwm",
  "actuatorType": "fan_pwm",
  "timestamp": "2026-02-18T12:00:00.000Z"
}
```

Supported commands:

- `on`
- `off`
- `toggle`
- `set` (for PWM/level)

Supported actuator types:

- `fan`
- `led_pwm`
- `fan_pwm`
- `relay`
- `custom`

---

## 4) Rule/Automation Topics

- `greenhouse/actions/{siteId}/{type}`
  - Rule engine and manual actions

Rules can now dispatch:

- actuator commands
- notification actions
- branch execution (`then` / `else`)

---

## 5) Notification & Issue Topics (Reserved)

### Mobile notification topic

- `greenhouse/notifications/mobile`
- Env override: `MQTT_MOBILE_NOTIFICATION_TOPIC`

### Issue/alert topic

- `greenhouse/alerts/issues`
- Env override: `MQTT_ISSUE_ALERT_TOPIC`

### Notification payload example

```json
{
  "type": "notification",
  "channel": "mobile",
  "title": "Greenhouse notification",
  "message": "Fan command executed in zone-1",
  "siteId": "zone-1",
  "timestamp": "2026-02-18T12:00:00.000Z"
}
```

---

## 6) AI Assistant Trigger Topics

Used by event-triggered custom prompts and suspected-problem engine outputs:

- `greenhouse/alerts/issues` (AI trigger outputs and problem alerts)
- `greenhouse/notifications/mobile` (end-user phone notifications)

---

## 7) Device Utilities

- Topic ping via API:
  - `POST /api/devices/:id/sensors/:sensorKey/ping`
- OLED command topic (default):
  - `greenhouse/{siteId}/command/oled/{deviceId}`

---

## 8) Naming Guidance

- Use lowercase topic segments.
- Prefer `_` in segment values over spaces.
- Keep topic depth stable for easier ACL and filtering.
- Keep payloads JSON and include `timestamp`.

---

## 9) Quick Checklist

- [ ] Telemetry topics configured per sensor (`mqttTopic`)
- [ ] Actuator sensors have `commandTopic`
- [ ] Rule builder actions mapped to actuator/notification modes
- [ ] Mobile and issue reserved topics configured in env (optional)
- [ ] Dashboard logs verify telemetry + actuator command events
