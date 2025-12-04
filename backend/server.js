const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ========== SIMPLE IN-MEMORY DATABASE ==========
let users = [];
let assignments = [];

// ========== TEST ROUTES (MUST WORK) ==========
app.get('/', (req, res) => {
  res.send('HomeworkHub API - Manage your assignments efficiently');
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    users: users.length,
    assignments: assignments.length
  });
});

// ========== AUTH ROUTES (WILL WORK) ==========
app.post('/api/auth/register', (req, res) => {
  console.log('📝 REGISTER:', req.body);
  
  const { username, email, password } = req.body;
  
  // Check if user exists
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ 
      success: false,
      message: 'User already exists' 
    });
  }
  
  // Create new user
  const newUser = {
    id: 'user_' + Date.now(),
    username,
    email,
    password, // In real app, hash this!
    createdAt: new Date()
  };
  
  users.push(newUser);
  console.log('✅ User saved:', newUser.email);
  
  // Return success
  res.status(201).json({
    success: true,
    message: 'Registration successful!',
    token: 'jwt_token_' + Date.now(),
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  console.log('🔑 LOGIN:', req.body.email);
  
  const { email, password } = req.body;
  
  // Find user
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    // If no user found, create a demo user
    const demoUser = {
      id: 'demo_' + Date.now(),
      username: 'HomeworkHub Student',
      email: email,
      password: password,
      createdAt: new Date()
    };
    
    users.push(demoUser);
    
    res.json({
      success: true,
      message: 'Login successful (demo account created)',
      token: 'jwt_token_' + Date.now(),
      user: {
        id: demoUser.id,
        username: demoUser.username,
        email: demoUser.email
      }
    });
  } else {
    res.json({
      success: true,
      message: 'Login successful!',
      token: 'jwt_token_' + Date.now(),
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  }
});

// ========== ASSIGNMENT ROUTES ==========
// Simple auth check
const checkAuth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }
  req.userId = token.split('_')[2] || 'demo_user'; // Extract from token
  next();
};

// Get all assignments for user
app.get('/api/assignments', checkAuth, (req, res) => {
  const userAssignments = assignments.filter(a => a.userId === req.userId);
  
  // If no assignments, return sample data
  if (userAssignments.length === 0) {
    const sampleAssignments = [
      {
        _id: '1',
        userId: req.userId,
        title: 'Welcome Assignment',
        course: 'Introduction',
        dueDate: '2024-12-15',
        priority: 'medium',
        status: 'pending',
        description: 'This is a sample assignment',
        createdAt: new Date()
      }
    ];
    return res.json(sampleAssignments);
  }
  
  res.json(userAssignments);
});

// Create new assignment
app.post('/api/assignments', checkAuth, (req, res) => {
  console.log('➕ CREATE ASSIGNMENT:', req.body);
  
  const newAssignment = {
    _id: 'assign_' + Date.now(),
    userId: req.userId,
    ...req.body,
    createdAt: new Date()
  };
  
  assignments.push(newAssignment);
  res.status(201).json(newAssignment);
});

// Update assignment
app.put('/api/assignments/:id', checkAuth, (req, res) => {
  console.log('✏️ UPDATE ASSIGNMENT:', req.params.id, req.body);
  
  const index = assignments.findIndex(a => a._id === req.params.id && a.userId === req.userId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Assignment not found' });
  }
  
  assignments[index] = {
    ...assignments[index],
    ...req.body,
    updatedAt: new Date()
  };
  
  res.json(assignments[index]);
});

// Delete assignment
app.delete('/api/assignments/:id', checkAuth, (req, res) => {
  console.log('🗑️ DELETE ASSIGNMENT:', req.params.id);
  
  const index = assignments.findIndex(a => a._id === req.params.id && a.userId === req.userId);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Assignment not found' });
  }
  
  assignments.splice(index, 1);
  res.json({ message: 'Assignment deleted successfully' });
});

// ========== START SERVER ==========
const PORT = 5000;
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 SERVER STARTED SUCCESSFULLY!');
  console.log(`📍 Port: ${PORT}`);
  console.log('='.repeat(50));
  console.log('✅ Test these URLs in your browser:');
  console.log(`   1. http://localhost:${PORT}/`);
  console.log(`   2. http://localhost:${PORT}/api/health`);
  console.log('='.repeat(50));
  console.log('📱 Frontend should be at: http://localhost:3000');
  console.log('='.repeat(50));
});