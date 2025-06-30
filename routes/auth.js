const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Helper functions
function readJsonFile(filePath, defaultValue = {}) {
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

// Login route
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Predefined admin credentials
  const adminUser = {
    username: 'admin',
    password: 'admin123'  // In a real application, this would be hashed
  };
  
  if (username === adminUser.username && password === adminUser.password) {
    req.session.isAuthenticated = true;
    req.session.user = { username };
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

// Check authentication status
router.get('/check', (req, res) => {
  res.json({
    isAuthenticated: req.session.isAuthenticated === true,
    user: req.session.user
  });
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

module.exports = router;