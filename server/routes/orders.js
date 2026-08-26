const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

router.post('/create', async (req, res) => {
  try {
    const { items, amount, paymentMethod, userId, customer_name, customer_phone, customer_address, customer_pincode } = req.body;

    if (paymentMethod === 'online') {
      // Create a Razorpay order first and return it to the client. Do NOT create DB order yet.
      const options = {
        amount: Math.round(amount * 100), // paise
        currency: 'INR',
        receipt: 'rcpt_' + Date.now()
      };

      const rOrder = await razorpay.orders.create(options);
      return res.json({ razorpayOrder: rOrder, key_id: process.env.RAZORPAY_KEY_ID });
    }

    // For COD, create order immediately in DB
    const orderDoc = new Order({
      userId,
      items,
      amount,
      paymentMethod,
      paymentStatus: 'pending',
      status: 'placed',
      customerName: customer_name || '',
      customerPhone: customer_phone || '',
      customerAddress: customer_address || '',
      customerPincode: customer_pincode || ''
    });
    await orderDoc.save();
    // Create a simple admin notification (this is lightweight; expand as needed)
    try{ const Notification = require('../models/Notification'); await Notification.create({ type:'order', message:'New COD order placed', data:{ orderId: orderDoc._id, userId } }); }catch(e){}

    res.json({ order: orderDoc });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/verify', async (req, res) => {
  const crypto = require('crypto');
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, items, amount, userId, customer_name, customer_phone, customer_address, customer_pincode } = req.body;

    // verify signature
    const key_secret = process.env.RAZORPAY_KEY_SECRET || '';
    const generated_signature = crypto.createHmac('sha256', key_secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // create order in DB now that payment is verified
      const orderDoc = new Order({
        userId: userId || null,
        items: items || [],
        amount: amount || 0,
        paymentMethod: 'online',
        paymentStatus: 'paid',
        status: 'placed',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        customerName: customer_name || '',
        customerPhone: customer_phone || '',
        customerAddress: customer_address || '',
        customerPincode: customer_pincode || ''
      });
      await orderDoc.save();
      // create admin notification
      try{ const Notification = require('../models/Notification'); await Notification.create({ type:'order', message:'New online order placed', data:{ orderId: orderDoc._id, userId } }); }catch(e){}

      return res.json({ ok: true, order: orderDoc });
    } else {
      return res.status(400).json({ error: 'Invalid signature' });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get orders for a user
router.get('/my/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get single order by id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email phone address pincode').lean();
    if(!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Dev helper: mark an order as paid (useful for testing without payment)
router.post('/:id/mark-paid', async (req, res) => {
  try {
    const { paymentId } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    order.paymentStatus = 'paid';
    order.razorpayPaymentId = paymentId || `dev-paid-${Date.now()}`;
    await order.save();
    res.json({ ok: true, order });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Prepare Razorpay checkout for an order refund
router.post('/:id/refund-initiate', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.canceled) return res.status(400).json({ error: 'Order already canceled' });
    if (order.paymentMethod !== 'online' || order.paymentStatus !== 'paid' || !order.razorpayPaymentId) {
      return res.status(400).json({ error: 'Order not eligible for refund' });
    }

    const amount = Number(order.amount) || 0;
    const paise = Math.round(amount * 100);
    const rOrder = await razorpay.orders.create({
      amount: paise,
      currency: 'INR',
      receipt: `refund_order_${order._id}_${Date.now()}`
    });

    return res.json({ ok: true, key_id: process.env.RAZORPAY_KEY_ID, amount, currency: 'INR', razorpayOrder: rOrder });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Cancel order and refund if applicable
router.post('/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.canceled) return res.status(400).json({ error: 'Order already canceled' });

    // If paid via online, attempt refund
    if (order.paymentMethod === 'online' && order.paymentStatus === 'paid' && order.razorpayPaymentId) {
      try {
        const refund = await razorpay.payments.refund(order.razorpayPaymentId, { amount: Math.round((order.amount || 0) * 100) });
        order.canceled = true;
        order.paymentStatus = 'refunded';
        order.refund = { refundId: refund.id || refund.entity || '', amount: order.amount, status: refund.status || 'processed' };
        await order.save();
        // notify admin
        try{ const Notification = require('../models/Notification'); await Notification.create({ type:'refund', message:'Order refunded', data:{ orderId: order._id } }); }catch(e){}
        return res.json({ ok: true, order, refund });
      } catch (e) {
        return res.status(500).json({ error: 'Refund failed: ' + e.message });
      }
    }

    // For COD or unpaid online orders, just mark canceled
    order.canceled = true;
    order.status = 'cancelled';
    if (order.paymentStatus !== 'paid') order.paymentStatus = 'cancelled';
    await order.save();
    try{ const Notification = require('../models/Notification'); await Notification.create({ type:'order_cancel', message:'Order cancelled', data:{ orderId: order._id } }); }catch(e){}
    res.json({ ok: true, order });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Cancel a specific item within an order (user action). This marks the item as canceled in DB.
router.post('/:id/items/:index/cancel', async (req, res) => {
  try{
    const { id, index } = req.params;
    const order = await Order.findById(id).populate('userId').exec();
    if(!order) return res.status(404).json({ error: 'Order not found' });
    const idx = parseInt(index, 10);
    if(isNaN(idx) || idx < 0 || idx >= (order.items||[]).length) return res.status(400).json({ error: 'Invalid item index' });
    const item = order.items[idx];
    if(item.canceled) return res.status(400).json({ error: 'Item already canceled' });

    item.canceled = true;
    // if entire order becomes canceled (all items canceled), mark order canceled
    const allCanceled = order.items.every(i => i.canceled === true);
    if(allCanceled){ order.canceled = true; order.status = 'cancelled'; }
    await order.save();
    // notify admin
    try{ const Notification = require('../models/Notification'); await Notification.create({ type:'order_cancel_item', message:`Item canceled: ${item.name}`, data:{ orderId: order._id, itemIndex: idx } }); }catch(e){}
    res.json({ ok: true, order });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

// Prepare Razorpay checkout for a canceled item refund so the admin can pay the amount after the popup opens
router.post('/:id/items/:index/refund-initiate', async (req, res) => {
  try{
    const { id, index } = req.params;
    const order = await Order.findById(id).populate('userId').exec();
    if(!order) return res.status(404).json({ error: 'Order not found' });
    const idx = parseInt(index, 10);
    if(isNaN(idx) || idx < 0 || idx >= (order.items||[]).length) return res.status(400).json({ error: 'Invalid item index' });
    const item = order.items[idx];
    if(item.refunded) return res.status(400).json({ error: 'Item already refunded' });
    if(order.paymentMethod !== 'online' || order.paymentStatus !== 'paid' || !order.razorpayPaymentId){
      return res.status(400).json({ error: 'Order not eligible for refund' });
    }

    const amount = (parseFloat(item.price) || 0) * (item.quantity || 1);
    const paise = Math.round(amount * 100);

    const rOrder = await razorpay.orders.create({
      amount: paise,
      currency: 'INR',
      receipt: `refund_${order._id}_${idx}_${Date.now()}`
    });

    return res.json({
      ok: true,
      key_id: process.env.RAZORPAY_KEY_ID,
      amount,
      currency: 'INR',
      razorpayOrder: rOrder
    });
  }catch(e){
    return res.status(500).json({ error: e.message });
  }
});

// Refund a specific item within an order (partial refund)
router.post('/:id/items/:index/refund', async (req, res) => {
  try{
    const { id, index } = req.params;
    const order = await Order.findById(id).populate('userId').exec();
    if(!order) return res.status(404).json({ error: 'Order not found' });
    const idx = parseInt(index, 10);
    if(isNaN(idx) || idx < 0 || idx >= (order.items||[]).length) return res.status(400).json({ error: 'Invalid item index' });
    const item = order.items[idx];
    if(item.refunded) return res.status(400).json({ error: 'Item already refunded' });

    // Must be online paid order with razorpayPaymentId
    if(order.paymentMethod !== 'online' || order.paymentStatus !== 'paid' || !order.razorpayPaymentId){
      return res.status(400).json({ error: 'Order not eligible for refund' });
    }

    // compute refund amount: use item.price * quantity (ensure number)
    const amount = (parseFloat(item.price) || 0) * (item.quantity || 1);
    const paise = Math.round(amount * 100);

    try{
      const refund = await razorpay.payments.refund(order.razorpayPaymentId, { amount: paise });
      // record refund at item level
      item.refunded = true;
      item.refundInfo = { refundId: refund.id || refund.entity || '', amount: amount, status: refund.status || 'processed' };
      await order.save();
      // notify
      try{ const Notification = require('../models/Notification'); await Notification.create({ type:'refund', message: `Refunded item ${item.name}`, data:{ orderId: order._id, itemIndex: idx } }); }catch(e){}
      return res.json({ ok: true, refund, order });
    }catch(e){
      return res.status(500).json({ error: 'Refund failed: ' + e.message });
    }

  }catch(e){ res.status(500).json({ error: e.message }); }
});

module.exports = router;
