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

// Submit contact form
router.post('/', (req, res) => {
  const { name, email, subject, message } = req.body;
  
  // Validate required fields
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const messagesFile = path.join(__dirname, '..', 'data', 'messages.json');
  const messages = readJsonFile(messagesFile);
  
  const newMessage = {
    id: generateId(),
    name,
    email,
    subject,
    message,
    timestamp: new Date().toISOString(),
    read: false
  };
  
  messages.push(newMessage);
  
  if (writeJsonFile(messagesFile, messages)) {
    res.status(201).json({ success: true, message: 'Message sent successfully' });
  } else {
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Get all messages (admin only)
router.get('/', isAuthenticated, (req, res) => {
  const messagesFile = path.join(__dirname, '..', 'data', 'messages.json');
  const messages = readJsonFile(messagesFile);
  res.json(messages);
});

// Get a specific message by ID (admin only)
router.get('/:id', isAuthenticated, (req, res) => {
  const messageId = req.params.id;
  const messagesFile = path.join(__dirname, '..', 'data', 'messages.json');
  const messages = readJsonFile(messagesFile);
  
  const message = messages.find(m => m.id === messageId);
  
  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }
  
  // Mark message as read if it's not already
  if (!message.read) {
    message.read = true;
    message.readAt = new Date().toISOString();
    writeJsonFile(messagesFile, messages);
  }
  
  res.json(message);
});

// Mark a message as read (admin only)
router.patch('/:id/read', isAuthenticated, (req, res) => {
  const messageId = req.params.id;
  const messagesFile = path.join(__dirname, '..', 'data', 'messages.json');
  const messages = readJsonFile(messagesFile);
  
  const messageIndex = messages.findIndex(m => m.id === messageId);
  
  if (messageIndex === -1) {
    return res.status(404).json({ error: 'Message not found' });
  }
  
  messages[messageIndex].read = true;
  messages[messageIndex].readAt = new Date().toISOString();
  
  if (writeJsonFile(messagesFile, messages)) {
    res.json({
      success: true,
      message: 'Message marked as read',
      data: messages[messageIndex]
    });
  } else {
    res.status(500).json({ error: 'Failed to update message' });
  }
});

// Delete a message (admin only)
router.delete('/:id', isAuthenticated, (req, res) => {
  const messageId = req.params.id;
  const messagesFile = path.join(__dirname, '..', 'data', 'messages.json');
  const messages = readJsonFile(messagesFile);
  
  const updatedMessages = messages.filter(message => message.id !== messageId);
  
  if (messages.length === updatedMessages.length) {
    return res.status(404).json({ error: 'Message not found' });
  }
  
  if (writeJsonFile(messagesFile, updatedMessages)) {
    res.json({ success: true, message: 'Message deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;