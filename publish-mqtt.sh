#!/bin/bash

# MQTT Data Publishing Test for Greenhouse OS
# Tests MQTT communication with broker

echo "════════════════════════════════════════════════════════════════"
echo "📡 MQTT Telemetry Publisher"
echo "════════════════════════════════════════════════════════════════"
echo ""

MQTT_BROKER="localhost"
MQTT_PORT="1883"
SITE_ID="1"
ZONE_ID="1"
MODE="publish"

if [ "$1" = "--list" ] || [ "$1" = "list" ]; then
  MODE="list"
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
  echo -e "${RED}✗ $1${NC}"
}

log_info() {
  echo -e "${YELLOW}ℹ $1${NC}"
}

print_topic_formats() {
  echo ""
  echo "════════════════════════════════════════════════════════════════"
  echo "📘 MQTT Topic List Format"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  echo "Recommended telemetry topic format:"
  echo "  greenhouse/{siteId}/telemetry/{sensorType}/{nodeId}"
  echo ""
  echo "Examples:"
  echo "  • greenhouse/$SITE_ID/telemetry/temperature/sensor-001"
  echo "  • greenhouse/$SITE_ID/telemetry/humidity/sensor-002"
  echo "  • greenhouse/$SITE_ID/telemetry/soil_moisture/sensor-003"
  echo "  • greenhouse/$SITE_ID/telemetry/light/sensor-004"
  echo "  • greenhouse/$SITE_ID/telemetry/co2/sensor-005"
  echo ""
  echo "Device status topic format:"
  echo "  greenhouse/{siteId}/devices/{deviceId}/status"
  echo ""
  echo "Payload (telemetry JSON) format:"
  cat <<EOF
{
  "siteId": "$SITE_ID",
  "zoneId": "$ZONE_ID",
  "nodeId": "sensor-001",
  "sensorType": "temperature",
  "value": 28.5,
  "unit": "°C",
  "quality": 100,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
  echo ""
  echo "Quick publish command:"
  echo "  mosquitto_pub -h $MQTT_BROKER -p $MQTT_PORT \\
    -t \"greenhouse/$SITE_ID/telemetry/temperature/sensor-001\" \\
    -m '{\"siteId\":\"$SITE_ID\",\"zoneId\":\"$ZONE_ID\",\"nodeId\":\"sensor-001\",\"sensorType\":\"temperature\",\"value\":28.5,\"unit\":\"°C\",\"quality\":100,\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}'"
  echo ""
  echo "════════════════════════════════════════════════════════════════"
}

if [ "$MODE" = "list" ]; then
  print_topic_formats
  exit 0
fi

# Check if mosquitto_pub is installed
if ! command -v mosquitto_pub &> /dev/null; then
    log_error "mosquitto_pub not found. Installing mosquitto-clients..."
    sudo apt-get update > /dev/null 2>&1
    sudo apt-get install -y mosquitto-clients > /dev/null 2>&1
fi

# Test 1: MQTT Connection
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Broker Connection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

timeout 3 mosquitto_pub -h "$MQTT_BROKER" -p "$MQTT_PORT" -t "test/connection" -m "test" 2>/dev/null
if [ $? -eq 0 ]; then
    log_success "Connected to MQTT broker at $MQTT_BROKER:$MQTT_PORT"
else
    log_error "Cannot connect to MQTT broker at $MQTT_BROKER:$MQTT_PORT"
    log_info "Make sure mosquitto is running: sudo systemctl start mosquitto"
    exit 1
fi

# Test 2: Temperature Telemetry
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Temperature Sensor Data"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOPIC="greenhouse/$SITE_ID/telemetry/temperature/sensor-001"
PAYLOAD='{
  "siteId":"'$SITE_ID'",
  "zoneId":"'$ZONE_ID'",
  "nodeId":"sensor-001",
  "sensorType":"temperature",
  "value":28.5,
  "unit":"°C",
  "quality":100,
  "timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}'

log_info "Publishing temperature data to: $TOPIC"
mosquitto_pub -h "$MQTT_BROKER" -p "$MQTT_PORT" -t "$TOPIC" -m "$PAYLOAD"
log_success "Temperature data published"

# Test 3: Humidity Data
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Humidity Sensor Data"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOPIC="greenhouse/$SITE_ID/telemetry/humidity/sensor-002"
PAYLOAD='{
  "siteId":"'$SITE_ID'",
  "zoneId":"'$ZONE_ID'",
  "nodeId":"sensor-002",
  "sensorType":"humidity",
  "value":65.3,
  "unit":"%",
  "quality":95,
  "timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}'

log_info "Publishing humidity data to: $TOPIC"
mosquitto_pub -h "$MQTT_BROKER" -p "$MQTT_PORT" -t "$TOPIC" -m "$PAYLOAD"
log_success "Humidity data published"

# Test 4: Soil Moisture Data
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Soil Moisture Sensor Data"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOPIC="greenhouse/$SITE_ID/telemetry/soil_moisture/sensor-003"
PAYLOAD='{
  "siteId":"'$SITE_ID'",
  "zoneId":"'$ZONE_ID'",
  "nodeId":"sensor-003",
  "sensorType":"soil_moisture",
  "value":42.8,
  "unit":"%",
  "quality":88,
  "timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}'

log_info "Publishing soil moisture data to: $TOPIC"
mosquitto_pub -h "$MQTT_BROKER" -p "$MQTT_PORT" -t "$TOPIC" -m "$PAYLOAD"
log_success "Soil moisture data published"

# Test 5: Power Consumption Data
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Power Consumption Data"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOPIC="greenhouse/$SITE_ID/telemetry/power/pump-001"
PAYLOAD='{
  "siteId":"'$SITE_ID'",
  "zoneId":"'$ZONE_ID'",
  "deviceId":"pump-001",
  "type":"power",
  "voltage":220,
  "current":5.2,
  "power":1144,
  "energyToday":28.6,
  "timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
}'

log_info "Publishing power data to: $TOPIC"
mosquitto_pub -h "$MQTT_BROKER" -p "$MQTT_PORT" -t "$TOPIC" -m "$PAYLOAD"
log_success "Power data published"

# Test 6: Device Status Update
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: Device Status Update"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOPIC="greenhouse/$SITE_ID/devices/pump-001/status"
PAYLOAD='{
  "deviceId":"pump-001",
  "status":"running",
  "uptime":3600,
  "lastHeartbeat":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
  "signalStrength":-45
}'

log_info "Publishing device status to: $TOPIC"
mosquitto_pub -h "$MQTT_BROKER" -p "$MQTT_PORT" -t "$TOPIC" -m "$PAYLOAD"
log_success "Device status published"

# Test 7: Bulk Temperature Publishing (Simulate continuous data)
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 7: Continuous Temperature Stream (5 readings)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for i in {1..5}; do
  TEMP=$(echo "scale=1; 25 + $RANDOM % 10" | bc)
  TOPIC="greenhouse/$SITE_ID/telemetry/temperature/sensor-001"
  PAYLOAD='{
    "siteId":"'$SITE_ID'",
    "zoneId":"'$ZONE_ID'",
    "nodeId":"sensor-001",
    "sensorType":"temperature",
    "value":'$TEMP',
    "unit":"°C",
    "quality":100,
    "timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'
  
  log_info "Publishing reading $i: ${TEMP}°C"
  mosquitto_pub -h "$MQTT_BROKER" -p "$MQTT_PORT" -t "$TOPIC" -m "$PAYLOAD"
  sleep 1
done

log_success "Continuous stream completed"

# Summary
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "📊 MQTT Publishing Summary"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "Published Topics:"
echo "  • greenhouse/$SITE_ID/telemetry/temperature/sensor-001"
echo "  • greenhouse/$SITE_ID/telemetry/humidity/sensor-002"
echo "  • greenhouse/$SITE_ID/telemetry/soil_moisture/sensor-003"
echo "  • greenhouse/$SITE_ID/telemetry/power/pump-001"
echo "  • greenhouse/$SITE_ID/devices/pump-001/status"
echo "  • greenhouse/$SITE_ID/telemetry/temperature/sensor-001 (5 readings stream)"
echo ""
echo "Total messages published: 11"
echo ""
echo "Backend Integration:"
echo "  → Check MongoDB for Telemetry collection"
echo "  → Check MongoDB for Power collection"
echo "  → Verify via API: GET /api/telemetry?siteId=$SITE_ID"
echo ""
echo "════════════════════════════════════════════════════════════════"
log_success "MQTT publishing tests completed!"
echo "════════════════════════════════════════════════════════════════"
