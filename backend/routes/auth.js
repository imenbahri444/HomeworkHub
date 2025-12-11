const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Your User model
const { v4: uuidv4 } = require('uuid'); // For generating unique user IDs

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user in MongoDB
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.json({
      success: true,
      message: 'Login successful!',
      token: 'jwt_token_' + user.id, // Simple token format
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user
    const newUser = new User({
      id: uuidv4(),
      username,
      email,
      password,
      createdAt: new Date()
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token: 'jwt_token_' + newUser.id,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
