const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  res.json(products);
});

router.get('/:id', async (req, res) => {
  try{
    const p = await Product.findById(req.params.id).lean();
    if(!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  }catch(e){ res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  const p = new Product(req.body);
  await p.save();
  res.json(p);
});

// update product
router.put('/:id', async (req, res) => {
  try{
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if(!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  }catch(e){ res.status(500).json({ error: e.message }); }
});

// delete product
router.delete('/:id', async (req, res) => {
  try{
    await Product.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  }catch(e){ res.status(500).json({ error: e.message }); }
});

module.exports = router;
