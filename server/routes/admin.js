const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Get all orders (admin)
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).populate('userId', 'name email phone address pincode').lean();
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifs = await Notification.find().sort({ createdAt: -1 }).lean();
    res.json(notifs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/notifications/:id/read', async (req, res) => {
  try {
    const n = await Notification.findById(req.params.id);
    if(!n) return res.status(404).json({ error: 'Not found' });
    n.read = true;
    await n.save();
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Mark all notifications read
router.post('/notifications/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { $set: { read: true } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Admin: add update to specific order item
router.post('/orders/:orderId/items/:itemIndex/update', async (req, res) => {
  try {
    const { text } = req.body;
    const order = await Order.findById(req.params.orderId);
    if(!order) return res.status(404).json({ error: 'Order not found' });
    const idx = parseInt(req.params.itemIndex, 10);
    if(isNaN(idx) || !order.items[idx]) return res.status(400).json({ error: 'Invalid item index' });
    order.items[idx].updates = order.items[idx].updates || [];
    order.items[idx].updates.push({ text });
    await order.save();
    // create notification for user
    try{ await Notification.create({ type:'update', message:'Order update', data:{ orderId: order._id, itemIndex: idx, text } }); }catch(e){}
    res.json({ ok: true, order });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;

