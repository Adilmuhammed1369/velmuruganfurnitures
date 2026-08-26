# Velmurugan Furnitures - Server

Backend server with Express, MongoDB and Razorpay sandbox integration.

Setup:

1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:

```bash
cd server
npm install
```

3. Start server:

```bash
npm run dev
```

The server serves the frontend files from the parent folder, so after starting the server you can open http://localhost:4000/buy.html or http://localhost:4000/home.html to use the site with the API on the same origin.

Endpoints:
- `GET /` - health check
- `GET /api/products` - list products
- `POST /api/cart` - add to cart (body: { userId, product })
- `GET /api/cart/:userId` - get cart
- `POST /api/orders/create` - create order (body: { items, amount, paymentMethod, userId })
- `POST /api/orders/verify` - verify payment (demo)

Payment gateway: Razorpay sandbox (free testing). Create account and use test key id/secret in `.env`.
