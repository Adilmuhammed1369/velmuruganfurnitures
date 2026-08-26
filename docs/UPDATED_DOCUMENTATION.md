# Velmurugan Furnitures — Updated Documentation

This document captures the current state of the project, features, APIs, data models and developer instructions.

## Project overview
Velmurugan Furnitures is a static frontend served alongside a Node/Express backend that provides product, cart, wishlist and order functionality. The frontend pages use localStorage for offline behavior and optionally call backend APIs when the server is running.

## Quick start
1. Copy `.env.example` to `.env` inside `server/` and set values (`MONGODB_URI`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`).
2. Install dependencies and run in dev mode:

```bash
cd server
npm install
npm run dev
```

3. Open the site: `http://localhost:4000/home.html`.

## Key pages and responsibilities
- `home.html` / `index.html` — product listing, search and quick cart interactions.
- `productdetails.html` — product detail view (uses localStorage `product`).
- `cart.html` — view cart (localStorage) and place orders.
- `buy.html` — confirm order + payment UI.
- `myorders.html` — list a user's orders (fetches `/api/orders/my/:userId`).
- `adminpanel.html` — admin UI for adding products, viewing orders, notifications.
- `reg.html` / `index.html` — user registration and login.

## Backend summary
- Entry: `server/index.js` — serves static frontend files and mounts API routes.
- Important routes: `server/routes/products.js`, `server/routes/cart.js`, `server/routes/orders.js`, `server/routes/users.js`, `server/routes/wishlist.js`, `server/routes/admin.js`.
- Models: `server/models/Product.js`, `server/models/User.js`, `server/models/Cart.js`, `server/models/Order.js`, `server/models/Notification.js`.

## API details
### Products
- `GET /api/products` — returns all products (most recent first)
- `GET /api/products/:id` — single product
- `POST /api/products` — create (admin)
- `PUT /api/products/:id` — update (admin)
- `DELETE /api/products/:id` — delete (admin)

Product model (simplified):
```js
{ name: String, price: String, img: String (DataURL or URL), description: String }
```

### Cart
- `POST /api/cart` — add item to cart (body: `{ userId, product }`)
- `GET /api/cart/:userId` — get cart for a user

Cart model stores items with `productId`, `name`, `price`, `img`, `quantity`.

### Orders
- `POST /api/orders/create` — create order. If `paymentMethod === 'online'`, server returns a Razorpay order object (client completes payment then calls `/api/orders/verify`). For COD, order is created immediately.
- `POST /api/orders/verify` — verify Razorpay signature, create DB order and mark paid.
- `GET /api/orders/my/:userId` — get orders for user
- `POST /api/orders/:id/cancel` — cancel order and attempt refund if paid online.
- Additional endpoints exist for marking paid, refunding individual items, and partial refunds. See the `server/routes/orders.js` file for behavior.

Order model highlights:
- `items`: array with `name`, `price`, `img`, `quantity`, `canceled`, `refunded`, `refundInfo`
- `paymentMethod`, `paymentStatus`, `status`, `razorpayOrderId`, `razorpayPaymentId` etc.

### Users
- `POST /api/users/register` — register user (fields: name, email, phone, address, pincode, password)
- `POST /api/users/login` — login via `username` (name or email) + `password`. Returns user without `password`.

### Notifications & Admin
- Notifications are created by order events and admin actions: write to `server/models/Notification.js` and can be read by admin endpoints.
- Admin endpoints live under `server/routes/admin.js` (product listing, notifications, orders aggregation).

## Frontend behavior notes
- Much of the frontend uses `localStorage` for `products`, `cart`, and `loginUser` to function without the backend.
- `assets/js/script.js` contains UI helpers and cart management; many pages include inline scripts that call the API when `loginUser._id` is present.
- Admin product image uploads convert files to base64 Data URLs and send them in JSON body to `/api/products`.

## Important scripts
- `server/scripts/normalize_products.js` — run once to migrate `image` → `img` and normalize price types.
- `server/scripts/clear_db.js` — destructive; requires `CONFIRM=YES` in `.env` to run.

## Security & operational notes
- Passwords are stored in plain text in this project. For production, replace with hashed passwords (bcrypt) and add authentication/authorization (JWT or sessions) for admin routes.
- Razorpay keys should use sandbox/test values for development.
- Consider limiting base64 image sizes or use direct file upload + storage (S3 or similar) for production.

## Changelog / What changed from the old doc
- Removed references to unrelated sample project and updated project name to `Velmurugan Furnitures`.
- Consolidated server API summaries and added endpoints for refunds and item-level operations (orders.js implements these).
- Clarified where admin UI stores images (base64) and server body size limits (`10mb`).
- Noted localStorage-first behavior of the frontend so the site can be previewed without the server.

---

If you want, I will:
- Commit these docs to the repository and create a Git commit.
- Export `docs/UPDATED_DOCUMENTATION.md` to `docs/Velmurugan_Documentation.docx` and add it to the repo.
- Update any HTML pages with missing links or minor fixes (e.g., ensure `home.html` links to `buy.html`).

Which of the above should I do next?