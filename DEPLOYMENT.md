# Railway Deployment Guide

## Overview
This setup adds MQTT streaming capabilities to your existing Traccar deployment without disrupting the current service.

## Services Architecture
1. **Traccar** (existing) - GPS tracking platform
2. **MQTT Broker** (new) - Message broker for mobile apps
3. **Bridge Service** (new) - Connects MQTT to Traccar

## Deployment Steps

### 1. Deploy MQTT Broker
```bash
cd mqtt-broker
railway login
railway init
railway up
```

**Environment Variables:**
- No additional variables needed for basic setup
- Default credentials: `traccar` / `password`

### 2. Deploy Bridge Service
```bash
cd mqtt-bridge
railway init
railway up
```

**Required Environment Variables:**
```bash
# MQTT Configuration
MQTT_BROKER_URL=mqtt://your-mqtt-service.railway.app:1883
MQTT_USERNAME=traccar
MQTT_PASSWORD=password

# Traccar Configuration  
TRACCAR_URL=https://your-traccar-service.railway.app
TRACCAR_USERNAME=admin
TRACCAR_PASSWORD=admin

# Server
PORT=3000
```

### 3. Update Network Configuration

In Railway dashboard:
1. **MQTT Broker**: Expose port `1883` (TCP) and `9001` (WebSocket)
2. **Bridge Service**: Expose port `3000` (HTTP API)
3. **Traccar**: Keep existing port `8082`

### 4. Test the Setup

#### Register User & Device
```bash
curl -X POST https://your-bridge-service.railway.app/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "name": "John Doe",
      "email": "john@example.com", 
      "password": "secure123"
    },
    "device": {
      "uniqueId": "phone-123",
      "name": "Johns iPhone"
    }
  }'
```

#### Test MQTT Connection
```javascript
// Using MQTT.js in your mobile app
const client = mqtt.connect('wss://your-mqtt-broker.railway.app:9001');

client.publish('gps/phone-123/location', JSON.stringify({
  latitude: 37.7749,
  longitude: -122.4194,
  timestamp: new Date().toISOString()
}));
```

## Mobile App Integration

### React Native Example
```javascript
import { Client } from 'react-native-mqtt';

// Connect to MQTT
const client = new Client({
  uri: 'wss://your-mqtt-broker.railway.app:9001',
  username: 'traccar',
  password: 'password'
});

// Send GPS location
const sendLocation = (latitude, longitude) => {
  client.publish('gps/my-device-id/location', JSON.stringify({
    latitude,
    longitude,
    timestamp: new Date().toISOString(),
    accuracy: 5.0
  }), 1); // QoS 1
};

// Send temperature
const sendTemperature = (temp) => {
  client.publish('sensors/my-device-id/temperature', JSON.stringify({
    temperature: temp,
    unit: 'celsius',
    timestamp: new Date().toISOString()
  }), 0); // QoS 0
};
```

### Flutter Example
```dart
import 'package:mqtt_client/mqtt_client.dart';

final client = MqttClient('your-mqtt-broker.railway.app', '');
client.port = 9001;
client.useWebSocket = true;

void publishLocation(double lat, double lon) {
  final payload = jsonEncode({
    'latitude': lat,
    'longitude': lon,
    'timestamp': DateTime.now().toIso8601String(),
  });
  
  client.publishMessage(
    'gps/flutter-device/location',
    MqttQos.atLeastOnce,
    Uint8List.fromList(payload.codeUnits)
  );
}
```

## API Endpoints

### Bridge Service
- `POST /api/register` - Register user and device
- `GET /api/user/:email` - Get user profile and devices  
- `GET /api/health` - Health check
- `POST /api/devices/:deviceId/position` - Send GPS data via HTTP

### MQTT Topics
- `device/{deviceId}/register` - Device registration
- `gps/{deviceId}/location` - GPS coordinates
- `sensors/{deviceId}/temperature` - Temperature data

## Security Considerations

1. **Change Default Passwords**: Update MQTT credentials in production
2. **Enable TLS**: Configure SSL certificates for production
3. **Rate Limiting**: Implement rate limiting on Bridge service
4. **Authentication**: Add JWT authentication for API endpoints

## Monitoring

- **MQTT Broker**: Check connection logs in Railway
- **Bridge Service**: Monitor `/api/health` endpoint
- **Traccar**: Existing monitoring continues to work

## Troubleshooting

1. **MQTT Connection Failed**:
   - Check broker URL and credentials
   - Verify port 1883/9001 are accessible

2. **GPS Data Not Appearing**:
   - Check bridge service logs
   - Verify Traccar credentials
   - Confirm device is registered

3. **High Latency**:
   - Use QoS 0 for temperature data
   - Batch GPS updates if needed
   - Check Railway service regions