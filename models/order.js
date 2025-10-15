// models/order.js

const mongoose = require('mongoose');

// Define the schema for an order
const orderSchema = new mongoose.Schema({
  // An array of items included in the order
  items: [{
    name: String,
    price: Number,
    quantity: Number
  }],
  // The total cost of the order
  totalAmount: {
    type: Number,
    required: true
  },
  // The date the order was placed, defaults to the current date and time
  date: {
    type: Date,
    default: Date.now
  }
});

// Create and export the Order model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
