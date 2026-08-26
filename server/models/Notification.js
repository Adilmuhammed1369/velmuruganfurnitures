const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  type: String,
  message: String,
  data: Object,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
