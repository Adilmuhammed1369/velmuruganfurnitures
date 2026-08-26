const mongoose = require('mongoose');

const WishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: String,
      img: String,
      addedAt: { type: Date, default: Date.now }
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Wishlist', WishlistSchema);
