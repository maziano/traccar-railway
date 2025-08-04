const axios = require('axios');

class UserService {
  constructor(traccarUrl, adminUsername, adminPassword) {
    this.traccarUrl = traccarUrl;
    this.adminAuth = {
      username: adminUsername,
      password: adminPassword
    };
  }

  // Register a new user in Traccar
  async registerUser(userData) {
    try {
      const userPayload = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        readonly: false,
        administrator: false,
        attributes: {
          registrationDate: new Date().toISOString(),
          source: 'mqtt-bridge',
          ...userData.attributes
        }
      };

      const response = await axios.post(
        `${this.traccarUrl}/api/users`,
        userPayload,
        { auth: this.adminAuth }
      );

      console.log(`User ${userData.email} registered successfully`);
      return response.data;
    } catch (error) {
      console.error(`Failed to register user ${userData.email}:`, error.message);
      throw error;
    }
  }

  // Create device for user
  async createDeviceForUser(userId, deviceData) {
    try {
      const devicePayload = {
        name: deviceData.name || `Device ${deviceData.uniqueId}`,
        uniqueId: deviceData.uniqueId,
        category: deviceData.category || 'mobile',
        attributes: {
          temperatureSupport: true,
          ...deviceData.attributes
        }
      };

      // Create device
      const deviceResponse = await axios.post(
        `${this.traccarUrl}/api/devices`,
        devicePayload,
        { auth: this.adminAuth }
      );

      // Link device to user
      const permissionPayload = {
        userId: userId,
        deviceId: deviceResponse.data.id
      };

      await axios.post(
        `${this.traccarUrl}/api/permissions`,
        permissionPayload,
        { auth: this.adminAuth }
      );

      console.log(`Device ${deviceData.uniqueId} linked to user ${userId}`);
      return deviceResponse.data;
    } catch (error) {
      console.error(`Failed to create device for user ${userId}:`, error.message);
      throw error;
    }
  }

  // Get user by email
  async getUserByEmail(email) {
    try {
      const response = await axios.get(
        `${this.traccarUrl}/api/users`,
        { auth: this.adminAuth }
      );

      return response.data.find(user => user.email === email);
    } catch (error) {
      console.error(`Failed to get user ${email}:`, error.message);
      throw error;
    }
  }

  // Get user devices
  async getUserDevices(userId) {
    try {
      const response = await axios.get(
        `${this.traccarUrl}/api/devices`,
        { 
          auth: this.adminAuth,
          params: { userId: userId }
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Failed to get devices for user ${userId}:`, error.message);
      throw error;
    }
  }
}

module.exports = UserService;