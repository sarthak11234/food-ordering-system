// routes/adminRoutes.js

const express = require('express');
const router = express.Router();
const Admin = require('../models/admin');
const Order = require('../models/order'); // assumes this exists

// Render login page
router.get('/login', (req, res) => {
	res.render('adminLogin', { error: null });
});

// Seed a default admin (simple helper)
router.get('/seed', async (req, res) => {
	try {
		const exists = await Admin.findOne({ email: 'admin@example.com' });
		if (exists) return res.send('Admin already exists');
		await Admin.create({ name: 'Default Admin', email: 'admin@example.com', password: 'password123' });
		res.send('✅ Admin seeded: admin@example.com / password123');
	} catch (err) {
		console.error(err);
		res.status(500).send('Error creating admin');
	}
});

// Handle login
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		const admin = await Admin.findOne({ email });
		if (!admin) return res.render('adminLogin', { error: 'Invalid credentials' });
		const ok = await admin.comparePassword(password);
		if (!ok) return res.render('adminLogin', { error: 'Invalid credentials' });
		// store admin id in session
		req.session = req.session || {};
		req.session.adminId = admin._id;
		res.redirect('/admin/dashboard');
	} catch (err) {
		console.error(err);
		res.status(500).send('Server error');
	}
});

// Middleware to protect admin routes
function requireAdmin(req, res, next) {
	req.session = req.session || {};
	const user = req.session.user;
	if (!user || !user.isAdmin) {
		return res.redirect('/auth/login');
	}
	next();
}

// Dashboard: list orders
router.get('/dashboard', requireAdmin, async (req, res) => {
	try {
		const orders = await Order.find().sort({ createdAt: -1 }).lean();
		res.render('adminDashboard', { orders });
	} catch (err) {
		console.error(err);
		res.status(500).send('Server error');
	}
});

// Update order status
router.post('/orders/:id/status', requireAdmin, async (req, res) => {
	try {
		const orderId = req.params.id;
		const { status } = req.body;
		await Order.findByIdAndUpdate(orderId, { status });
		res.redirect('/admin/dashboard');
	} catch (err) {
		console.error(err);
		res.status(500).send('Error updating order');
	}
});

// Logout
router.get('/logout', (req, res) => {
	if (req.session) {
		req.session.adminId = null;
	}
	res.redirect('/admin/login');
});

// GET /admin - render admin dashboard with all orders
router.get('/', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.render('adminDashboard', { orders });
  } catch (err) {
    console.error('Error fetching orders for admin:', err);
    res.status(500).send('Server Error');
  }
});

// POST /admin/orders/:id/status - update an order's status
router.post('/orders/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await Order.findByIdAndUpdate(id, { status }, { new: true });
    res.redirect('/admin');
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).send('Error updating status');
  }
});

// GET /admin/logout - destroy session and redirect
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