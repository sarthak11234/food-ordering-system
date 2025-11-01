const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user');

// Show registration form
router.get('/register', (req, res) => {
  res.render('register');
});

// Handle registration
router.post('/register', async (req, res) => {
  const { email, password, adminCode } = req.body;
  if (!email || !password) return res.status(400).send('Email and password required');
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).send('User already exists');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const isAdmin = adminCode === process.env.ADMIN_CODE; // optional simple admin code
    const user = new User({ email, passwordHash, isAdmin });
    await user.save();
    req.session.user = { id: user._id.toString(), email: user.email, isAdmin: user.isAdmin };
    res.redirect('/');
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).send('Server error');
  }
});

// Show login form
router.get('/login', (req, res) => {
  res.render('login');
});

// Handle login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).send('Email and password required');
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).send('Invalid credentials');
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(400).send('Invalid credentials');
    req.session.user = { id: user._id.toString(), email: user.email, isAdmin: user.isAdmin };
    res.redirect('/');
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).send('Server error');
  }
});

// Logout
router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) console.error('Session destroy error:', err);
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});

module.exports = router;
