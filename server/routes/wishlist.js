const express = require('express');
const router = express.Router();
const Wishlist = require('../models/Wishlist');

// Add an item to wishlist
router.post('/', async (req, res) => {
  try {
    const { userId, product } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    let wl = await Wishlist.findOne({ userId });
    if (!wl) wl = new Wishlist({ userId, items: [] });

    wl.items.push(product);
    wl.updatedAt = new Date();
    await wl.save();

    res.json(wl);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get wishlist for user
router.get('/:userId', async (req, res) => {
  try {
    const wl = await Wishlist.findOne({ userId: req.params.userId }).lean();
    res.json(wl || { items: [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Replace entire wishlist for a user (sync)
router.put('/:userId', async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    let wl = await Wishlist.findOne({ userId });
    if (!wl) wl = new Wishlist({ userId, items: items || [] });
    else wl.items = items || [];
    wl.updatedAt = new Date();
    await wl.save();
    res.json(wl);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
