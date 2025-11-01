// app.js

// 1. Import Dependencies
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

// Import route handlers
const menuRoutes = require('./routes/menuRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const FoodItem = require('./models/foodItem');
const Order = require('./models/order');

// 2. Initialize Express App
const app = express();
const PORT = 3000;

// 3. Database Connection
mongoose.connect('mongodb://127.0.0.1:27017/foodDB')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// 4. Middleware Setup
// body parsing (needed for login and forms)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// session (needed for admin login persistence)
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: true,
}));

// Set EJS as the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// ensure a cart exists for menu rendering
app.locals.cart = app.locals.cart || [];

// 5. In-Memory Cart
// This will act as our temporary cart storage.
// In a real-world app, you'd use sessions or a database-backed cart.
let cart = [];

// Make the cart available to all routes by attaching it to the app's locals
app.locals.cart = cart;

// Make session user available to all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session && req.session.user ? req.session.user : null;
  next();
});

// Mount auth routes
app.use('/auth', authRoutes);

// Redirect root URL: show home for guests, menu for logged-in users
app.get('/', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/menu');
  }
  res.render('home');
});

// Mount menu routes at /menu
app.use('/menu', menuRoutes);

// Mount admin, order, and auth routes
app.use('/admin', adminRoutes);
app.use('/orders', orderRoutes);

// Add item to cart (robust handling of different field names)
app.post('/cart/add', async (req, res) => {
  // accept common field names from forms or ajax
  const foodItemId = req.body.foodItemId || req.body.foodId || req.body.id;
  const quantity = req.body.quantity || req.body.qty || req.body.q;

  if (!foodItemId) {
    return res.status(400).send('No food item selected');
  }

  try {
    const foodItem = await FoodItem.findById(foodItemId);
    if (!foodItem) {
      return res.status(404).send('Food item not found');
    }

    const qty = parseInt(quantity, 10) || 1;

    // Normalize id to string for comparison/storage
    const idStr = String(foodItem._id);

    // Check if already in cart
    const existing = cart.find(item => String(item.foodItemId) === idStr);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({
        foodItemId: idStr,
        name: foodItem.name,
        price: foodItem.price,
        quantity: qty
      });
    }

    // sync app.locals so other routes that read req.app.locals.cart see updates
    req.app.locals.cart = cart;

    // redirect to cart so user can immediately verify
    res.redirect('/cart');
  } catch (err) {
    console.error('Error adding to cart:', err);
    res.status(500).send('Error adding to cart');
  }
});

// Show cart contents (read from app.locals)
app.get('/cart', (req, res) => {
  const currentCart = req.app.locals.cart || [];
  const totalAmount = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  res.render('cart', { cart: currentCart, totalAmount });
});

// Checkout and create order (attach user if logged in)
app.post('/cart/checkout', async (req, res) => {
  const currentCart = req.app.locals.cart || [];
  if (!currentCart.length) {
    return res.status(400).send('Cart is empty');
  }
  try {
    const orderItems = currentCart.map(item => ({
      foodItemId: item.foodItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    // Defensive validation
    for (const item of orderItems) {
      if (!item.foodItemId || !item.name || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return res.status(400).send('Invalid cart item');
      }
    }

    const order = new Order({
      items: orderItems,
      total: currentCart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'pending',
      createdAt: new Date(),
      user: req.session && req.session.user ? req.session.user.id : undefined // <-- attach user
    });

    await order.save();

    // Clear cart and sync app.locals
    cart.length = 0;
    req.app.locals.cart = cart;

    res.redirect('/orders');
  } catch (err) {
    console.error('Order placement error:', err);
    res.status(500).send('Error placing order');
  }
});

// 7. Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
