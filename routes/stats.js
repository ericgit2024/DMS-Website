const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Helper functions
function readJsonFile(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return defaultValue;
  }
}

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// Get dashboard statistics (admin only)
router.get('/', isAuthenticated, (req, res) => {
  const alertsFile = path.join(__dirname, '..', 'data', 'alerts', 'alerts.json');
  const volunteersFile = path.join(__dirname, '..', 'data', 'volunteers', 'volunteers.json');
  const messagesFile = path.join(__dirname, '..', 'data', 'messages.json');
  
  const alerts = readJsonFile(alertsFile);
  const volunteers = readJsonFile(volunteersFile);
  const messages = readJsonFile(messagesFile);
  
  const rainAlerts = alerts.filter(alert => alert.type === 'rain').length;
  const floodAlerts = alerts.filter(alert => alert.type === 'flood').length;
  const unreadMessages = messages.filter(message => !message.read).length;
  
  // Get volunteer statistics by district
  const volunteersByDistrict = {};
  volunteers.forEach(volunteer => {
    const district = volunteer.district;
    if (!volunteersByDistrict[district]) {
      volunteersByDistrict[district] = 0;
    }
    volunteersByDistrict[district]++;
  });
  
  // Get volunteer statistics by type
  const volunteersByType = {};
  volunteers.forEach(volunteer => {
    const type = volunteer.volunteerType;
    if (!volunteersByType[type]) {
      volunteersByType[type] = 0;
    }
    volunteersByType[type]++;
  });
  
  // Get alert statistics by location
  const alertsByLocation = {};
  alerts.forEach(alert => {
    const location = alert.location;
    if (!alertsByLocation[location]) {
      alertsByLocation[location] = 0;
    }
    alertsByLocation[location]++;
  });
  
  res.json({
    rainAlerts,
    floodAlerts,
    volunteers: volunteers.length,
    messages: unreadMessages,
    volunteersByDistrict,
    volunteersByType,
    alertsByLocation
  });
});

module.exports = router;