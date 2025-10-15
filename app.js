// app.js

// 1. Import Dependencies
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

// Import route handlers
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');

// 2. Initialize Express App
const app = express();
const PORT = 3000;

// 3. Database Connection
mongoose.connect('mongodb://127.0.0.1:27017/foodDB')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// 4. Middleware Setup
// Set EJS as the view engine
app.set('view engine', 'ejs');
// Serve static files from the 'public' directory
app.use(express.static('public'));
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(bodyParser.urlencoded({ extended: true }));

// 5. In-Memory Cart
// This will act as our temporary cart storage.
// In a real-world app, you'd use sessions or a database-backed cart.
let cart = [];

// Make the cart available to all routes by attaching it to the app's locals
app.locals.cart = cart;

// 6. Mount Routes
// Use the imported route handlers
app.use('/', menuRoutes);
app.use('/', orderRoutes);

// 7. Start the Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
