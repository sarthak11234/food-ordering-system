// models/foodItem.js

const mongoose = require('mongoose');

// Define the schema for a food item
const foodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  image: {
    type: String, // URL to the image
    required: true
  },
  category: {
    type: String,
    required: true
  }
});

// Create and export the FoodItem model
const FoodItem = mongoose.model('FoodItem', foodItemSchema);

module.exports = FoodItem;
