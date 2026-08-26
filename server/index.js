require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
// increase JSON body size to allow base64 image uploads from admin UI
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// friendly error for large payloads
app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large. Please upload smaller image (<=10MB) or use compressed image.' });
  }
  next(err);
});
const path = require('path');

// Serve frontend static files from parent directory so frontend can call API on same origin
app.use(express.static(path.join(__dirname, '..')));

// Support direct URL navigation for the static pages used by the storefront
const frontendPages = {
  '/': 'index.html',
  '/home': 'home.html',
  '/home.html': 'home.html',
  '/index': 'index.html',
  '/index.html': 'index.html',
  '/login': 'index.html',
  '/login.html': 'index.html',
  '/register': 'reg.html',
  '/reg': 'reg.html',
  '/reg.html': 'reg.html',
  '/admin': 'admin.html',
  '/admin.html': 'admin.html',
  '/adminpanel': 'adminpanel.html',
  '/adminpanel.html': 'adminpanel.html',
  '/cart': 'cart.html',
  '/cart.html': 'cart.html',
  '/wishlist': 'wishlist.html',
  '/wishlist.html': 'wishlist.html',
  '/myorders': 'myorders.html',
  '/myorders.html': 'myorders.html',
  '/buy': 'buy.html',
  '/buy.html': 'buy.html',
  '/productdetails': 'productdetails.html',
  '/productdetails.html': 'productdetails.html',
  '/newproducts': 'newproducts.html',
  '/newproducts.html': 'newproducts.html'
};

for (const [route, file] of Object.entries(frontendPages)) {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, '..', file));
  });
}

// Lightweight health endpoint (no DB) to verify server is running
app.get('/api/health', (req, res) => res.json({ ok: true, env: process.env.NODE_ENV || 'development' }));

const PORT = process.env.PORT || 4000;

const mongoUri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  console.warn('No MongoDB connection string found. Set MONGODB_URI or MONGODB_ATLAS_URI in the server .env file.');
}

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected using:', process.env.MONGODB_ATLAS_URI ? 'MongoDB Atlas' : 'local MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Models
const Product = require('./models/Product');
const User = require('./models/User');
const Cart = require('./models/Cart');
const Order = require('./models/Order');

// Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// generic error handler (catch any remaining errors)
app.use((err, req, res, next) => {
  if (!err) return next();
  if (err.status === 413 || err.type === 'entity.too.large' || err.name === 'PayloadTooLargeError' || /too large/i.test(err.message || '')) {
    return res.status(413).json({ error: 'Payload too large. Please upload smaller image (<=10MB) or use compressed image.' });
  }
  console.error('Unhandled error:', err);
  res.status(err.status || 500).send(err.message || 'Server error');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
