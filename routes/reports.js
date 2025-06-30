const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const REPORTS_PATH = path.join(__dirname, '../data/reports.json');
const UPLOADS_DIR = path.join(__dirname, '../public/uploads/reports');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({ storage, limits: { files: 3, fileSize: 5 * 1024 * 1024 } });

function readReports() {
  try {
    if (fs.existsSync(REPORTS_PATH)) {
      const data = fs.readFileSync(REPORTS_PATH, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading reports file:', error);
    return [];
  }
}
function writeReports(reports) {
  try {
    fs.writeFileSync(REPORTS_PATH, JSON.stringify(reports, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing reports file:', error);
    return false;
  }
}

// Submit a new report
router.post('/', upload.array('photos', 3), (req, res) => {
  const { incidentType, customIncident, location, description, name, phone } = req.body;
  if (!incidentType || (incidentType === 'Other' && !customIncident) || !location || !description || !name || !phone) {
    return res.status(400).json({ error: 'All required fields must be filled.' });
  }
  if (!/^[0-9]{10}$/.test(phone)) {
    return res.status(400).json({ error: 'Invalid phone number.' });
  }
  const photos = req.files ? req.files.map(f => '/uploads/reports/' + f.filename) : [];
  const report = {
    id: uuidv4(),
    incidentType: incidentType === 'Other' ? customIncident : incidentType,
    location,
    description,
    photos,
    name,
    phone,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };
  const reports = readReports();
  reports.unshift(report);
  writeReports(reports);
  res.json({ success: true });
});

// Admin: Get all reports (always read from file, with error handling)
router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(REPORTS_PATH)) return res.json([]);
    const data = fs.readFileSync(REPORTS_PATH, 'utf8');
    const reports = JSON.parse(data);
    if (!Array.isArray(reports)) throw new Error('Malformed reports data');
    res.json(reports);
  } catch (error) {
    console.error('Error reading reports:', error);
    res.status(500).json({ error: 'Failed to load reports. Please check the reports data file.' });
  }
});

// Admin: Approve/Reject a report
router.patch('/:id', (req, res) => {
  // Require admin authentication in real use
  const { status } = req.body;
  if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status.' });
  const reports = readReports();
  const idx = reports.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Report not found.' });
  reports[idx].status = status;
  writeReports(reports);
  res.json({ success: true });
});

// Public: Get approved reports
router.get('/approved', (req, res) => {
  const reports = readReports().filter(r => r.status === 'Approved');
  res.json(reports);
});

module.exports = router;
