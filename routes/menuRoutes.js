// routes/menuRoutes.js

const express = require('express');
const router = express.Router();
const FoodItem = require('../models/foodItem');

// Route to display all food items (the menu)
router.get('/', async (req, res) => {
  try {
    const foodItems = await FoodItem.find();
    // Render the menu page, passing the food items and the cart
    res.render('menu', { foodItems: foodItems, cart: req.app.locals.cart });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Route to seed the database with sample food items
router.get('/seed', async (req, res) => {
  const sampleFoodItems = [
    { name: 'Classic Burger', price: 8.99, image: '/images/burger.jpg', category: 'Burgers' },
    { name: 'Margherita Pizza', price: 12.50, image: '/images/pizza.jpg', category: 'Pizzas' },
    { name: 'Crispy Fries', price: 4.50, image: '/images/fries.jpg', category: 'Sides' },
    { name: 'Caesar Salad', price: 7.25, image: '/images/salad.jpg', category: 'Salads' }
  ];

  try {
    // Clear existing items and insert new ones
    await FoodItem.deleteMany({});
    await FoodItem.insertMany(sampleFoodItems);
    res.send('✅ Database seeded successfully with sample food items!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error seeding database');
  }
});

module.exports = router;
