const express = require('express');
const router = express.Router();
const Assignment = require('../models/Assignment'); // Your Assignment model
const checkAuth = require('../middleware/auth'); // Auth middleware

// TEST ROUTE - This should work
router.get('/test', (req, res) => {
  res.json({ message: 'Assignments test route is working!' });
});

// GET all assignments for logged-in user
router.get('/', checkAuth, async (req, res) => {
  try {
    const userAssignments = await Assignment.find({ userId: req.userId });
    res.json(userAssignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// CREATE new assignment
router.post('/', checkAuth, async (req, res) => {
  try {
    const newAssignment = new Assignment({
      _id: 'assign_' + Date.now(),
      userId: req.userId, // Associate assignment with logged-in user
      ...req.body,
      createdAt: new Date()
    });

    await newAssignment.save();
    res.status(201).json(newAssignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE assignment
router.put('/:id', checkAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findOne({ _id: req.params.id, userId: req.userId });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    Object.assign(assignment, req.body, { updatedAt: new Date() });
    await assignment.save();
    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE assignment
router.delete('/:id', checkAuth, async (req, res) => {
  try {
    const assignment = await Assignment.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    res.json({ message: 'Assignment deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
