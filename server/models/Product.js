const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: String,
  price: String,
  img: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);
