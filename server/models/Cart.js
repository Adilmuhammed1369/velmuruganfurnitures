const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: String,
      img: String,
      quantity: { type: Number, default: 1 }
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', CartSchema);
