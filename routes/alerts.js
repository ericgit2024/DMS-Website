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

function writeJsonFile(filePath, data) {
  try {
    const dirPath = path.dirname(filePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// Get all alerts
router.get('/', (req, res) => {
  const alertsFile = path.join(__dirname, '..', 'data', 'alerts', 'alerts.json');
  const alerts = readJsonFile(alertsFile, []);
  res.json(alerts);
});

// Create new alert (protected by authentication)
router.post('/', isAuthenticated, (req, res) => {
  const { title, type, description, location, date } = req.body;
  if (!title || !type || !description || !location || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const newAlert = {
    id: generateId(),
    title,
    type,
    description,
    location,
    date,
    timestamp: new Date().toISOString(),
    createdBy: req.session.user.username
  };
  const alertsFile = path.join(__dirname, '..', 'data', 'alerts', 'alerts.json');
  const alerts = readJsonFile(alertsFile, []);
  alerts.unshift(newAlert); // Add new alert at the beginning
  if (writeJsonFile(alertsFile, alerts)) {
    res.json(newAlert);
  } else {
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

// Edit alert (PUT)
router.put('/:id', isAuthenticated, (req, res) => {
  const { title, type, description, location, date } = req.body;
  const alertsFile = path.join(__dirname, '..', 'data', 'alerts', 'alerts.json');
  const alerts = readJsonFile(alertsFile, []);
  const idx = alerts.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Alert not found' });
  alerts[idx] = {
    ...alerts[idx],
    title,
    type,
    description,
    location,
    date
  };
  if (writeJsonFile(alertsFile, alerts)) {
    res.json(alerts[idx]);
  } else {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

// Delete alert (protected by authentication)
router.delete('/:id', isAuthenticated, (req, res) => {
  const alertsFile = path.join(__dirname, '..', 'data', 'alerts', 'alerts.json');
  const alerts = readJsonFile(alertsFile, []);
  const filteredAlerts = alerts.filter(alert => alert.id !== req.params.id);
  
  if (writeJsonFile(alertsFile, filteredAlerts)) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: 'Failed to delete alert' });
  }
});

// Get a single alert by ID
router.get('/:id', (req, res) => {
  const alertsFile = path.join(__dirname, '..', 'data', 'alerts', 'alerts.json');
  const alerts = readJsonFile(alertsFile, []);
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.json(alert);
});

module.exports = router;