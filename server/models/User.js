const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  address: String,
  pincode: String,
  password: String
  ,
  // optional refund/payout details provided by user (admin can view)
  refundAccount: {
    upi: String,
    bankAccount: String,
    ifsc: String,
    accountName: String
  }
});

module.exports = mongoose.model('User', UserSchema);
