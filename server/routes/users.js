const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, address, pincode, password } = req.body;
    const user = new User({ name, email, phone, address, pincode, password });
    await user.save();
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get user by id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Login (by email or name)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const user = await User.findOne({ $or: [{ email: username }, { name: username }] }).lean();
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.password !== password) return res.status(401).json({ error: 'Invalid credentials' });

    // remove password before sending
    delete user.password;
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
