const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const axios = require('axios'); // Add at the top

// Import routes
const alertsRoutes = require('./routes/alerts');
const volunteersRoutes = require('./routes/volunteers');
const authRoutes = require('./routes/auth');
const contactRoutes = require('./routes/contact');
const statsRoutes = require('./routes/stats');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: 'disaster-guard-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 } // 1 hour
}));

// Ensure data directories exist
const dataDir = path.join(__dirname, 'data');
const alertsDir = path.join(dataDir, 'alerts');
const volunteersDir = path.join(dataDir, 'volunteers');

[dataDir, alertsDir, volunteersDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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

// API Routes
app.use('/api/alerts', alertsRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/auth', authRoutes); // <-- Fix: mount /auth for login/logout/check
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stats', statsRoutes);

// Legacy routes for backward compatibility
app.post('/api/login', (req, res) => {
  // Forward to the auth route
  req.url = '/login';
  app._router.handle(req, res);
});

app.post('/api/logout', (req, res) => {
  // Forward to the auth route
  req.url = '/logout';
  app._router.handle(req, res);
});

// Page routes
app.get('/admin', (req, res) => {
  if (req.session.isAuthenticated) {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  if (req.session.isAuthenticated) {
    res.redirect('/admin');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

// Catch-all route to serve index.html for client-side routing
app.get('*', (req, res) => {
  // Check if the requested path is for an HTML file in the public directory
  const requestedPath = path.join(__dirname, 'public', req.path + '.html');
  if (fs.existsSync(requestedPath)) {
    return res.sendFile(requestedPath);
  }
  
  // Otherwise serve the index.html file
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize sample data if not exists
function initializeSampleData() {
  const alertsFile = path.join(alertsDir, 'alerts.json');
  
  if (!fs.existsSync(alertsFile)) {
    const sampleAlerts = [
      {
        id: generateId(),
        type: 'rain',
        title: 'Heavy Rainfall Warning for Idukki District',
        description: 'The Meteorological Department has issued a heavy rainfall warning for Idukki district. Residents are advised to stay indoors and avoid unnecessary travel.',
        location: 'Idukki',
        date: '2023-07-15',
        timestamp: new Date().toISOString()
      },
      {
        id: generateId(),
        type: 'flood',
        title: 'Flood Alert for Wayanad District',
        description: 'Due to continuous heavy rainfall, flood alert has been issued for low-lying areas of Wayanad district. Residents are advised to move to higher ground or designated relief camps.',
        location: 'Wayanad',
        date: '2023-07-14',
        severity: 'severe',
        timestamp: new Date().toISOString()
      },
      {
        id: generateId(),
        type: 'rain',
        title: 'Moderate to Heavy Rainfall Expected in Kozhikode',
        description: 'Moderate to heavy rainfall is expected in Kozhikode district over the next 48 hours. Residents are advised to take necessary precautions.',
        location: 'Kozhikode',
        date: '2023-07-13',
        timestamp: new Date().toISOString()
      }
    ];
    
    writeJsonFile(alertsFile, sampleAlerts);
    console.log('Sample alerts data initialized');
  }
  
  // Initialize empty volunteers.json if it doesn't exist
  const volunteersFile = path.join(volunteersDir, 'volunteers.json');
  if (!fs.existsSync(volunteersFile)) {
    writeJsonFile(volunteersFile, []);
    console.log('Empty volunteers data initialized');
  }
  
  // Initialize empty messages.json if it doesn't exist
  const messagesFile = path.join(dataDir, 'messages.json');
  if (!fs.existsSync(messagesFile)) {
    writeJsonFile(messagesFile, []);
    console.log('Empty messages data initialized');
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  initializeSampleData();
});