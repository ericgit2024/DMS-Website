const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const axios = require('axios'); // Add at the top
const multer = require('multer');

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
const reportsDir = path.join(dataDir, 'reports_photos');

[dataDir, alertsDir, volunteersDir, reportsDir].forEach(dir => {
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

// Multer setup for photo uploads (max 3 files, 2MB each)
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            const dir = path.join(__dirname, 'data', 'reports_photos');
            fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'));
        }
    }),
    limits: { fileSize: 2 * 1024 * 1024, files: 3 },
    fileFilter: function (req, file, cb) {
        if (['image/jpeg', 'image/png'].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPG and PNG images are allowed.'));
        }
    }
});

// Helper to read JSON file safely
function readJsonFileSync(filePath, fallback = []) {
    try {
        if (!fs.existsSync(filePath)) return fallback;
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return fallback;
    }
}

// Helper to write JSON file safely
function writeJsonFileSync(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// API Routes
app.use('/api/alerts', alertsRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/auth', authRoutes); // <-- Fix: mount /auth for login/logout/check
app.use('/api/auth', authRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stats', statsRoutes);

// Incident report submission endpoint
app.post('/api/reports', upload.array('photos', 3), (req, res) => {
  try {
    const { incidentType, otherType, location, description, name, phone } = req.body;
    // Validation
    if (!incidentType || !location || !description || !name || !phone) {
      return res.status(400).json({ error: 'All required fields must be filled.' });
    }
    if (incidentType === 'Other' && (!otherType || !otherType.trim())) {
      return res.status(400).json({ error: 'Please specify the incident type.' });
    }
    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number.' });
    }
    // Prepare report object
    const report = {
      id: generateId(),
      type: incidentType === 'Other' ? otherType.trim() : incidentType, // Use 'type' for consistency
      location: location.trim(),
      description: description.trim(),
      photos: req.files ? req.files.map(f => 'data/reports_photos/' + path.basename(f.path)) : [],
      name: name.trim(),
      phone: phone.trim(),
      status: 'Pending',
      timestamp: new Date().toISOString()
    };
    // Save to reports.json
    const reportsFile = path.join(__dirname, 'data', 'reports.json');
    let reports = readJsonFile(reportsFile, []);
    reports.push(report);
    writeJsonFile(reportsFile, reports);
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving report:', err);
    res.status(500).json({ error: 'Failed to submit report. Please try again.' });
  }
});

// API: Get all incident reports (admin dashboard)
app.get('/api/reports', (req, res) => {
    try {
        const reportsPath = path.join(__dirname, 'data', 'reports.json');
        const reports = readJsonFileSync(reportsPath);
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load reports.' });
    }
});

// API: Approve or reject a report
app.patch('/api/reports/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status.' });
        }
        const reportsPath = path.join(__dirname, 'data', 'reports.json');
        const reports = readJsonFileSync(reportsPath);
        const idx = reports.findIndex(r => r.id === id);
        if (idx === -1) return res.status(404).json({ error: 'Report not found.' });
        reports[idx].status = status;
        writeJsonFileSync(reportsPath, reports);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update report status.' });
    }
});

// API: Get all volunteers (always from file)
app.get('/api/volunteers', (req, res) => {
    try {
        const volunteersPath = path.join(__dirname, 'data', 'volunteers', 'volunteers.json');
        const volunteers = readJsonFileSync(volunteersPath);
        res.json(volunteers);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load volunteers.' });
    }
});

// API: Get all alerts (always from file)
app.get('/api/alerts', (req, res) => {
    try {
        const alertsPath = path.join(__dirname, 'data', 'alerts', 'alerts.json');
        const alerts = readJsonFileSync(alertsPath);
        res.json(alerts);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load alerts.' });
    }
});

// API: Get all contact messages (always from file)
app.get('/api/contact', (req, res) => {
    try {
        const messagesPath = path.join(__dirname, 'data', 'messages.json');
        const messages = readJsonFileSync(messagesPath);
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Failed to load messages.' });
    }
});

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