# MQTT Topics Structure

## Device Registration
**Topic:** `device/{deviceId}/register`

**Payload:**
```json
{
  "name": "My Phone",
  "attributes": {
    "model": "iPhone 14",
    "os": "iOS 17.1"
  }
}
```

**Response Topic:** `device/{deviceId}/registered`
```json
{
  "success": true,
  "traccarDeviceId": 123
}
```

## GPS Location Data
**Topic:** `gps/{deviceId}/location`

**Payload:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "altitude": 10.5,
  "speed": 25.3,
  "course": 180,
  "accuracy": 5.0,
  "timestamp": "2025-01-01T12:00:00Z",
  "batteryLevel": 0.85,
  "attributes": {
    "source": "gps",
    "satellites": 8
  }
}
```

## Temperature Data
**Topic:** `sensors/{deviceId}/temperature`

**Payload:**
```json
{
  "temperature": 25.5,
  "unit": "celsius",
  "timestamp": "2025-01-01T12:00:00Z",
  "sensorId": "internal"
}
```

## Mobile App Integration Example

### JavaScript/React Native
```javascript
import mqtt from 'mqtt';

const client = mqtt.connect('wss://your-mqtt-broker.railway.app:9001', {
  username: 'traccar',
  password: 'your_password'
});

// Register device
client.publish('device/my-phone-123/register', JSON.stringify({
  name: 'My iPhone',
  attributes: { model: 'iPhone 14' }
}));

// Send GPS data
navigator.geolocation.getCurrentPosition((position) => {
  client.publish('gps/my-phone-123/location', JSON.stringify({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: new Date().toISOString()
  }));
});

// Send temperature (if available)
client.publish('sensors/my-phone-123/temperature', JSON.stringify({
  temperature: 23.5,
  unit: 'celsius',
  timestamp: new Date().toISOString()
}));
```

### Flutter/Dart
```dart
import 'package:mqtt_client/mqtt_client.dart';

final client = MqttClient('your-mqtt-broker.railway.app', '');
client.port = 1883;
client.setProtocolV311();

// GPS tracking
void sendLocation(double lat, double lon) {
  final payload = jsonEncode({
    'latitude': lat,
    'longitude': lon,
    'timestamp': DateTime.now().toIso8601String(),
  });
  
  client.publishMessage(
    'gps/my-device-456/location',
    MqttQos.atLeastOnce,
    Uint8List.fromList(payload.codeUnits)
  );
}
```

## QoS Levels
- **GPS Data:** QoS 1 (at least once delivery)
- **Temperature:** QoS 0 (fire and forget)
- **Registration:** QoS 2 (exactly once delivery)