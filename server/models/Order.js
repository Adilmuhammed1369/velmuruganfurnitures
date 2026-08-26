const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [
    {
      name: String,
      price: String,
      img: String,
      quantity: { type: Number, default: 1 },
      canceled: { type: Boolean, default: false },
      refunded: { type: Boolean, default: false },
      refundInfo: {
        refundId: String,
        amount: Number,
        status: String
      },
      updates: [
        {
          text: String,
          createdAt: { type: Date, default: Date.now }
        }
      ]
    }
  ],
  amount: Number,
  customerName: String,
  customerPhone: String,
  customerAddress: String,
  customerPincode: String,
  paymentMethod: String,
  paymentStatus: { type: String, default: 'pending' },
  status: { type: String, default: 'placed' },
  canceled: { type: Boolean, default: false },
  refund: {
    refundId: String,
    amount: Number,
    status: String
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
