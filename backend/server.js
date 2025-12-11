require("dotenv").config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ========== MONGODB CONNECTION ==========
mongoose.connect(process.env.MONGODB_URI || "mongodb://mongodb:27017/assignment-tracker")
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });

// ========== MONGODB MODELS ==========
const userSchema = new mongoose.Schema({
  id: String,
  username: String,
  email: String,
  password: String,
  createdAt: Date
});

const assignmentSchema = new mongoose.Schema({
  _id: String,
  userId: String,
  title: String,
  course: String,
  dueDate: String,
  priority: String,
  status: String,
  description: String,
  createdAt: Date,
  updatedAt: Date
});

const User = mongoose.model('User', userSchema);
const Assignment = mongoose.model('Assignment', assignmentSchema);

// ========== ROUTES ==========

// Test route
app.get('/', (req, res) => {
  res.send('HomeworkHub API - Manage your assignments efficiently');
});

// ========== AUTH ROUTES ==========
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in MongoDB
    let user = await User.findOne({ email, password });

    if (!user) {
      // If no user found, create demo user
      user = new User({
        id: 'demo_' + Date.now(),
        username: 'HomeworkHub Student',
        email,
        password,
        createdAt: new Date()
      });

      await user.save();
    }

    res.json({
      success: true,
      message: 'Login successful!',
      token: 'jwt_token_' + user.id,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// ========== AUTH CHECK MIDDLEWARE ==========
const checkAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  req.userId = token.split('_')[2]; // Extract userId from token
  next();
};

// ========== ASSIGNMENT ROUTES ==========
app.get('/api/assignments', checkAuth, async (req, res) => {
  try {
    const userAssignments = await Assignment.find({ userId: req.userId });

    // Return sample assignment if user has none
    if (userAssignments.length === 0) {
      return res.json([{
        _id: '1',
        userId: req.userId,
        title: 'Welcome Assignment',
        course: 'Introduction',
        dueDate: '2024-12-15',
        priority: 'medium',
        status: 'pending',
        description: 'This is a sample assignment',
        createdAt: new Date()
      }]);
    }

    res.json(userAssignments);
  } catch (err) {
    console.error("Fetch assignments error:", err);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

app.post('/api/assignments', checkAuth, async (req, res) => {
  try {
    const newAssignment = new Assignment({
      _id: 'assign_' + Date.now(),
      userId: req.userId,
      ...req.body,
      createdAt: new Date()
    });

    await newAssignment.save();
    res.status(201).json(newAssignment);
  } catch (err) {
    console.error("Create assignment error:", err);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

app.put('/api/assignments/:id', checkAuth, async (req, res) => {
  try {
    const updatedAssignment = await Assignment.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedAssignment) return res.status(404).json({ error: 'Assignment not found' });

    res.json(updatedAssignment);
  } catch (err) {
    console.error("Update assignment error:", err);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

app.delete('/api/assignments/:id', checkAuth, async (req, res) => {
  try {
    const deleted = await Assignment.deleteOne({ _id: req.params.id, userId: req.userId });
    if (deleted.deletedCount === 0) return res.status(404).json({ error: 'Assignment not found' });

    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error("Delete assignment error:", err);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// ========== START SERVER ==========
const PORT = 5000;
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 SERVER STARTED SUCCESSFULLY!');
  console.log(`📍 Port: ${PORT}`);
  console.log('📱 Frontend should be at: http://localhost:3000');
  console.log('='.repeat(50));
});
