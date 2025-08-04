const mqtt = require('mqtt');
const axios = require('axios');
const express = require('express');
const cors = require('cors');
const { initializeRoutes } = require('./routes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const MQTT_BROKER = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const MQTT_USERNAME = process.env.MQTT_USERNAME || 'traccar';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || 'password';
const TRACCAR_URL = process.env.TRACCAR_URL || 'http://localhost:8082';
const TRACCAR_USERNAME = process.env.TRACCAR_USERNAME || 'admin';
const TRACCAR_PASSWORD = process.env.TRACCAR_PASSWORD || 'admin';
const PORT = process.env.PORT || 3000;

// Device registry (in production, use database)
const deviceRegistry = new Map();

// Initialize API routes
const apiRoutes = initializeRoutes(TRACCAR_URL, TRACCAR_USERNAME, TRACCAR_PASSWORD);
app.use('/api', apiRoutes);

// MQTT Client setup
const mqttClient = mqtt.connect(MQTT_BROKER, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  reconnectPeriod: 5000,
  connectTimeout: 30000
});

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  
  // Subscribe to GPS and temperature topics
  mqttClient.subscribe([
    'gps/+/location',
    'sensors/+/temperature',
    'device/+/register'
  ], (err) => {
    if (err) {
      console.error('Failed to subscribe to topics:', err);
    } else {
      console.log('Subscribed to GPS and sensor topics');
    }
  });
});

mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    const topicParts = topic.split('/');
    const deviceId = topicParts[1];
    
    console.log(`Received message on topic ${topic}:`, data);
    
    if (topic.includes('/register')) {
      await handleDeviceRegistration(deviceId, data);
    } else if (topic.includes('/location')) {
      await handleGPSData(deviceId, data);
    } else if (topic.includes('/temperature')) {
      await handleTemperatureData(deviceId, data);
    }
  } catch (error) {
    console.error('Error processing MQTT message:', error);
  }
});

// Handle device registration
async function handleDeviceRegistration(deviceId, data) {
  try {
    // Register device in Traccar
    const deviceData = {
      name: data.name || `Device ${deviceId}`,
      uniqueId: deviceId,
      category: 'default',
      attributes: {
        temperature: true,
        ...data.attributes
      }
    };
    
    const response = await axios.post(`${TRACCAR_URL}/api/devices`, deviceData, {
      auth: {
        username: TRACCAR_USERNAME,
        password: TRACCAR_PASSWORD
      }
    });
    
    deviceRegistry.set(deviceId, response.data);
    console.log(`Device ${deviceId} registered successfully`);
    
    // Send confirmation back to device
    mqttClient.publish(`device/${deviceId}/registered`, JSON.stringify({
      success: true,
      traccarDeviceId: response.data.id
    }));
    
  } catch (error) {
    console.error(`Failed to register device ${deviceId}:`, error.message);
    mqttClient.publish(`device/${deviceId}/registered`, JSON.stringify({
      success: false,
      error: error.message
    }));
  }
}

// Handle GPS data
async function handleGPSData(deviceId, data) {
  try {
    const positionData = {
      deviceId: deviceId,
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude || 0,
      speed: data.speed || 0,
      course: data.course || 0,
      accuracy: data.accuracy || 0,
      fixTime: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
      valid: true,
      attributes: {
        batteryLevel: data.batteryLevel,
        ...data.attributes
      }
    };
    
    // Send to Traccar using OsmAnd protocol (simpler)
    const osmandUrl = `${TRACCAR_URL}/?id=${deviceId}&lat=${data.latitude}&lon=${data.longitude}&timestamp=${Date.now()}&hdop=${data.accuracy || 1}&altitude=${data.altitude || 0}&speed=${data.speed || 0}`;
    
    await axios.get(osmandUrl, {
      auth: {
        username: TRACCAR_USERNAME,
        password: TRACCAR_PASSWORD
      }
    });
    
    console.log(`GPS data sent to Traccar for device ${deviceId}`);
  } catch (error) {
    console.error(`Failed to send GPS data for device ${deviceId}:`, error.message);
  }
}

// Handle temperature data
async function handleTemperatureData(deviceId, data) {
  try {
    // Store temperature data temporarily and include in next GPS update
    const device = deviceRegistry.get(deviceId) || {};
    device.lastTemperature = data.temperature;
    device.temperatureTimestamp = data.timestamp || new Date().toISOString();
    deviceRegistry.set(deviceId, device);
    
    console.log(`Temperature data stored for device ${deviceId}: ${data.temperature}°C`);
  } catch (error) {
    console.error(`Failed to process temperature data for device ${deviceId}:`, error.message);
  }
}

// REST API endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    mqtt: mqttClient.connected,
    devices: deviceRegistry.size 
  });
});

app.get('/devices', (req, res) => {
  res.json(Array.from(deviceRegistry.entries()).map(([id, data]) => ({
    deviceId: id,
    ...data
  })));
});

app.post('/devices/:deviceId/position', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { latitude, longitude, ...otherData } = req.body;
    
    await handleGPSData(deviceId, { latitude, longitude, ...otherData });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

mqttClient.on('error', (error) => {
  console.error('MQTT connection error:', error);
});

app.listen(PORT, () => {
  console.log(`Bridge service running on port ${PORT}`);
});