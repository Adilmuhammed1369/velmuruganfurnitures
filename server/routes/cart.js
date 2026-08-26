const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Add item to cart (for simplicity we accept product data or productId)
router.post('/', async (req, res) => {
  try {
    const { userId, product } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    let cart = await Cart.findOne({ userId });
    if (!cart) cart = new Cart({ userId, items: [] });

    cart.items.push(product);
    cart.updatedAt = new Date();
    await cart.save();

    res.json(cart);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get cart
router.get('/:userId', async (req, res) => {
  const cart = await Cart.findOne({ userId: req.params.userId }).lean();
  res.json(cart || { items: [] });
});

// Replace entire cart (sync)
router.put('/:userId', async (req, res) => {
  try{
    const userId = req.params.userId;
    const { items } = req.body;
    if(!userId) return res.status(400).json({ error: 'userId required' });
    let cart = await Cart.findOne({ userId });
    if(!cart) cart = new Cart({ userId, items: items || [] });
    else cart.items = items || [];
    cart.updatedAt = new Date();
    await cart.save();
    res.json(cart);
  }catch(e){ res.status(500).json({ error: e.message }); }
});

module.exports = router;
