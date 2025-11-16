
// src/server.js - HIPAA Enhanced
const express = require('express');
const cors = require('cors');
const { securityHeaders, additionalHeaders } = require('./middleware/securityHeaders');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
// const accessCleanupService = require('./services/accessCleanupService');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(additionalHeaders);
app.use(compression());
// app.use('/api/access', require('./routes/accessControl'));

// Enhanced CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// // Enhanced rate limiting
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: parseInt(process.env.AUTH_RATE_LIMIT) || 5,
//   message: {
//     status: 'error',
//     message: 'Too many authentication attempts, please try again later.'
//   }
// });

// const sensitiveLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: parseInt(process.env.SENSITIVE_RATE_LIMIT) || 10,
//   message: {
//     status: 'error',
//     message: 'Too many requests, please try again later.'
//   }
// });




// app.use('/api/auth', authLimiter);
// app.use('/api/patients', sensitiveLimiter);
// app.use('/api/medical-records', sensitiveLimiter);

// // Body parsing with limits
app.use(express.json({ limit: '1mb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// // Static files - ensure no PHI in filenames
app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// // Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/medical-records', require('./routes/medicalRecords'));
app.use('/api/prescriptions', require('./routes/prescriptions'));
app.use('/api/lab-results', require('./routes/labResults'));
app.use('/api/users', require('./routes/users'));
app.use('/api/billing', require('./routes/billing'));


// // Health check (no sensitive info)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'EHR System API is running',
    timestamp: new Date().toISOString()
  });
});

// // 404 handler
// app.use('/*', (req, res) => {
//   res.status(404).json({
//     status: 'error',
//     message: 'Route not found'
//   });
// });



// if (process.env.NODE_ENV === 'production') {
//   accessCleanupService.startScheduledCleanup();
// }



// // Global error handler
app.use(require('./middleware/errorHandler'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 EHR Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔒 Security: Enhanced HIPAA compliance mode`);
});

module.exports = app;