// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// Debug: Check if imports are working
console.log('authController:', typeof authController);
console.log('authController.register:', typeof authController.register);
console.log('authenticate:', typeof auth);

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', auth, authController.getProfile);
router.post('/change-password', auth, authController.changePassword);

module.exports = router;