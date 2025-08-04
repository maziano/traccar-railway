const express = require('express');
const UserService = require('./userService');

const router = express.Router();

// Initialize user service
let userService;

function initializeRoutes(traccarUrl, adminUsername, adminPassword) {
  userService = new UserService(traccarUrl, adminUsername, adminPassword);
  return router;
}

// Register new user and device
router.post('/register', async (req, res) => {
  try {
    const { user, device } = req.body;

    // Validate required fields
    if (!user?.email || !user?.password || !device?.uniqueId) {
      return res.status(400).json({
        error: 'Missing required fields: user.email, user.password, device.uniqueId'
      });
    }

    // Check if user already exists
    const existingUser = await userService.getUserByEmail(user.email);
    let userData;

    if (existingUser) {
      userData = existingUser;
      console.log(`User ${user.email} already exists`);
    } else {
      // Register new user
      userData = await userService.registerUser(user);
    }

    // Create device for user
    const deviceData = await userService.createDeviceForUser(userData.id, device);

    res.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name
      },
      device: {
        id: deviceData.id,
        uniqueId: deviceData.uniqueId,
        name: deviceData.name
      },
      mqttCredentials: {
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        broker: process.env.MQTT_BROKER_URL
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error.message
    });
  }
});

// Get user profile and devices
router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const user = await userService.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const devices = await userService.getUserDevices(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      devices: devices.map(device => ({
        id: device.id,
        uniqueId: device.uniqueId,
        name: device.name,
        category: device.category
      }))
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Failed to get user',
      message: error.message
    });
  }
});

// Health check with user service status
router.get('/health', async (req, res) => {
  try {
    // Test connection to Traccar
    const testResponse = await userService.getUserByEmail('test@example.com');
    
    res.json({
      status: 'healthy',
      traccarConnection: 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      traccarConnection: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = { initializeRoutes };