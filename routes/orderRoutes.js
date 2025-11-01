// routes/orderRoutes.js

const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const FoodItem = require('../models/foodItem');

// Route to display the cart
router.get('/cart', (req, res) => {
  const cart = req.app.locals.cart;
  let totalAmount = 0;
  // Calculate the total amount
  cart.forEach(item => {
    totalAmount += item.price * item.quantity;
  });
  res.render('cart', { cart: cart, totalAmount: totalAmount });
});

// Route to add an item to the cart (POST request)
router.post('/cart/add', async (req, res) => {
  const itemId = req.body.itemId;
  const cart = req.app.locals.cart;

  try {
    const foodItem = await FoodItem.findById(itemId);
    if (!foodItem) {
      return res.status(404).send('Item not found');
    }

    // Check if item is already in the cart
    const existingItem = cart.find(item => item.id === itemId);
    if (existingItem) {
      existingItem.quantity += 1; // Increase quantity
    } else {
      // Add new item to cart
      cart.push({
        id: foodItem._id,
        name: foodItem.name,
        price: foodItem.price,
        quantity: 1
      });
    }
    res.redirect('/'); // Redirect back to the menu
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Route to display all placed orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 }); // Show newest first
    res.render('orders', { orders: orders });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Route to handle new order submission (POST request)
router.post('/orders/new', async (req, res) => {
  const cart = req.app.locals.cart;
  if (cart.length === 0) {
    return res.redirect('/'); // Can't place an empty order
  }

  let totalAmount = 0;
  const orderItems = cart.map(item => {
    totalAmount += item.price * item.quantity;
    return { name: item.name, price: item.price, quantity: item.quantity };
  });

  const newOrder = new Order({
    items: orderItems,
    totalAmount: totalAmount
  });

  try {
    await newOrder.save();
    // Clear the cart after placing the order
    req.app.locals.cart = [];
    res.redirect('/orders'); // Redirect to the order history page
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// GET /orders - show all orders (for demo, shows all orders)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    // If you have an orders.ejs view:
    res.render('orders', { orders });
    // If you don't have orders.ejs, you can use:
    // res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching orders');
  }
});

module.exports = router;
