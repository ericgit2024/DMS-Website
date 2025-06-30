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

// Get all volunteers (admin only)
router.get('/', isAuthenticated, (req, res) => {
  const volunteersFile = path.join(__dirname, '..', 'data', 'volunteers', 'volunteers.json');
  const volunteers = readJsonFile(volunteersFile);
  // Only filter out rejected
  const visibleVolunteers = volunteers.filter(v => v.status !== 'rejected');
  res.json(visibleVolunteers);
});

// Register a new volunteer
router.post('/', (req, res) => {
  // Accept both name or firstName+lastName
  let name = req.body.name;
  if (!name && req.body.firstName && req.body.lastName) {
    name = req.body.firstName + ' ' + req.body.lastName;
  }
  const email = req.body.email;
  const phone = req.body.phone;
  const address = req.body.address;
  const district = req.body.district;
  const availability = req.body.availability;
  const skills = req.body.skills;
  const emergencyContact = {
    name: req.body.emergencyName,
    phone: req.body.emergencyPhone,
    relation: req.body.emergencyRelation
  };
  const comments = req.body.comments;
  const volunteerType = req.body.volunteerType;
  const age = req.body.age;
  const gender = req.body.gender;
  const city = req.body.city;
  const pincode = req.body.pincode;
  const duration = req.body.duration;
  const experience = req.body.experience;
  const languages = req.body.languages;
  const medicalConditions = req.body.medicalConditions;

  // Validate required fields
  if (!name || !email || !phone || !address || !district || !availability || !volunteerType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const volunteersFile = path.join(__dirname, '..', 'data', 'volunteers', 'volunteers.json');
  const volunteers = readJsonFile(volunteersFile);

  // Check if email already exists
  const existingVolunteer = volunteers.find(v => v.email === email);
  if (existingVolunteer) {
    return res.status(400).json({ error: 'Email already registered' });
  }

  const newVolunteer = {
    id: generateId(),
    name,
    email,
    phone,
    address,
    city,
    district,
    pincode,
    age,
    gender,
    availability,
    duration,
    skills,
    experience,
    languages,
    emergencyContact,
    medicalConditions,
    comments: comments || '',
    volunteerType,
    timestamp: new Date().toISOString(),
    status: 'pending' // pending, approved, rejected
  };

  volunteers.push(newVolunteer);

  if (writeJsonFile(volunteersFile, volunteers)) {
    res.status(201).json({
      success: true,
      message: 'Volunteer registration successful',
      volunteer: newVolunteer
    });
  } else {
    res.status(500).json({ error: 'Failed to save volunteer information' });
  }
});

// Get a specific volunteer by ID (admin only)
router.get('/:id', isAuthenticated, (req, res) => {
  const volunteerId = req.params.id;
  const volunteersFile = path.join(__dirname, '..', 'data', 'volunteers', 'volunteers.json');
  const volunteers = readJsonFile(volunteersFile);
  
  const volunteer = volunteers.find(v => v.id === volunteerId);
  
  if (!volunteer) {
    return res.status(404).json({ error: 'Volunteer not found' });
  }
  
  res.json(volunteer);
});

// Update volunteer status (admin only)
router.patch('/:id/status', isAuthenticated, (req, res) => {
  const volunteerId = req.params.id;
  const { status } = req.body;
  
  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  const volunteersFile = path.join(__dirname, '..', 'data', 'volunteers', 'volunteers.json');
  const volunteers = readJsonFile(volunteersFile);
  
  const volunteerIndex = volunteers.findIndex(v => v.id === volunteerId);
  
  if (volunteerIndex === -1) {
    return res.status(404).json({ error: 'Volunteer not found' });
  }
  
  volunteers[volunteerIndex].status = status;
  volunteers[volunteerIndex].updatedAt = new Date().toISOString();
  
  if (writeJsonFile(volunteersFile, volunteers)) {
    res.json({
      success: true,
      message: `Volunteer status updated to ${status}`,
      volunteer: volunteers[volunteerIndex]
    });
  } else {
    res.status(500).json({ error: 'Failed to update volunteer status' });
  }
});

// Delete a volunteer (admin only)
router.delete('/:id', isAuthenticated, (req, res) => {
  const volunteerId = req.params.id;
  const volunteersFile = path.join(__dirname, '..', 'data', 'volunteers', 'volunteers.json');
  const volunteers = readJsonFile(volunteersFile);
  
  const updatedVolunteers = volunteers.filter(volunteer => volunteer.id !== volunteerId);
  
  if (volunteers.length === updatedVolunteers.length) {
    return res.status(404).json({ error: 'Volunteer not found' });
  }
  
  if (writeJsonFile(volunteersFile, updatedVolunteers)) {
    res.json({ success: true, message: 'Volunteer deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete volunteer' });
  }
});

module.exports = router;