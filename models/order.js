// models/order.js

const mongoose = require('mongoose');

// Define the schema for an order
const orderSchema = new mongoose.Schema({
  // An array of items included in the order
  items: [{
    // Reference to the food item in the FoodItem collection
    foodItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
    // The name of the food item
    name: { type: String, required: true },
    // The price of the food item
    price: { type: Number, required: true },
    // The quantity of the food item ordered
    quantity: { type: Number, required: true }
  }],
  // The total cost of the order
  total: { type: Number, required: true },
  // The status of the order, defaults to 'pending'
  status: { type: String, default: 'pending' },
  // The date the order was created, defaults to the current date and time
  createdAt: { type: Date, default: Date.now },
  // Optional reference to the user placing the order
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
});

// Create and export the Order model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
