const express = require('express');
const router = express.Router();

// TEST ROUTE - This should work
router.get('/test', (req, res) => {
  res.json({ message: 'Auth test route is working!' });
});

module.exports = router;