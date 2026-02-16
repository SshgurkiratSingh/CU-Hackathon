# API Reference

## Base URL

```
http://localhost:3000/api
```

All endpoints require authentication unless specified otherwise.

## Authentication

### Register User

**POST** `/auth/register`

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "name": "John Doe",
    "role": "farmer"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com"
  }
}
```

### Login

**POST** `/auth/login`

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "farmer"
    }
  }
}
```

### Using Token

Add to request headers:
```
Authorization: Bearer <token>
```

## Telemetry Endpoints

### Submit Telemetry

**POST** `/telemetry`

```bash
curl -X POST http://localhost:3000/api/telemetry \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "siteId": "farm_001",
    "temperature": 32.5,
    "humidity": 65,
    "soilMoisture": 45,
    "co2": 420,
    "timestamp": "2026-02-16T17:30:00Z"
  }'
```

### Get Telemetry

**GET** `/telemetry?siteId=farm_001&limit=100&offset=0`

## AI Endpoints

### AI Analysis

**POST** `/ai/analyze`

Analyze environmental conditions:

```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "condition": "High temperature (35°C) and low soil moisture (30%)",
    "context": "Tomato greenhouse"
  }'
```

### AI Decision Making

**POST** `/ai/decide`

Get AI recommendations:

```bash
curl -X POST http://localhost:3000/api/ai/decide \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "condition": "Temperature: 35°C, Humidity: 40%, Soil Moisture: 30%",
    "options": ["Activate cooling", "Start irrigation", "Increase ventilation"],
    "farm_id": "farm_001"
  }'
```

### AI Summarization

**POST** `/ai/summarize`

Generate telemetry summaries:

```bash
curl -X POST http://localhost:3000/api/ai/summarize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "telemetry": {
      "temperature": "32°C",
      "humidity": "65%",
      "soilMoisture": "45%",
      "co2": "420ppm"
    }
  }'
```

## Rules Endpoints

### Create Rule

**POST** `/rules`

```bash
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Auto Irrigation",
    "condition": "soilMoisture < 40",
    "action": "trigger_irrigation",
    "enabled": true
  }'
```

### Get Rules

**GET** `/rules?siteId=farm_001`

### Update Rule

**PUT** `/rules/:ruleId`

### Delete Rule

**DELETE** `/rules/:ruleId`

## Actions Endpoints

### Create Action

**POST** `/actions`

```bash
curl -X POST http://localhost:3000/api/actions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Start Irrigation",
    "type": "valve_control",
    "siteId": "farm_001",
    "parameters": {"valve": "main", "duration": 300}
  }'
```

### Trigger Action

**POST** `/actions/:actionId/trigger`

### Get Actions

**GET** `/actions?siteId=farm_001`

## Device Endpoints

### Register Device

**POST** `/devices`

```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Greenhouse Sensor",
    "type": "sensor",
    "siteId": "farm_001",
    "model": "DHT22"
  }'
```

### Get Devices

**GET** `/devices?siteId=farm_001`

### Update Device

**PUT** `/devices/:deviceId`

## Response Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

## Error Response Format

```json
{
  "success": false,
  "error": "Description of error",
  "timestamp": "2026-02-16T17:30:00.000Z"
}
```

---

For detailed endpoint documentation, see [Backend README](../../backend/README.md)
