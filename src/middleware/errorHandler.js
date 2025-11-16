// // src/middleware/errorHandler.js
// const errorHandler = (err, req, res, next) => {
//   let error = { ...err };
//   error.message = err.message;

//   console.error(err);

//   // Prisma errors
//   if (err.code === 'P2002') {
//     const field = err.meta?.target?.[0];
//     error.message = `Duplicate field value: ${field}. Please use another value.`;
//     error.statusCode = 400;
//   }

//   if (err.code === 'P2025') {
//     error.message = 'Record not found';
//     error.statusCode = 404;
//   }

//   // JWT errors
//   if (err.name === 'JsonWebTokenError') {
//     error.message = 'Invalid token';
//     error.statusCode = 401;
//   }

//   if (err.name === 'TokenExpiredError') {
//     error.message = 'Token expired';
//     error.statusCode = 401;
//   }

//   res.status(error.statusCode || 500).json({
//     status: 'error',
//     message: error.message || 'Server Error',
//     ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
//   });
// };

// module.exports = errorHandler;


// src/middleware/errorHandler.js - HIPAA Safe
// const errorHandler = (err, req, res, next) => {
//   let error = { ...err };
//   error.message = err.message;

//   // Don't log sensitive information
//   const safeError = {
//     message: err.message,
//     code: err.code,
//     stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
//   };

//   console.error('Error:', safeError);

//   // Never expose PHI in error messages
//   let userMessage = 'An error occurred';
//   let statusCode = error.statusCode || 500;

//   // Prisma errors
//   if (err.code === 'P2002') {
//     const field = err.meta?.target?.[0];
//     userMessage = `Duplicate field value. Please use another value.`;
//     statusCode = 400;
//   }

//   if (err.code === 'P2025') {
//     userMessage = 'Record not found';
//     statusCode = 404;
//   }

//   // JWT errors
//   if (err.name === 'JsonWebTokenError') {
//     userMessage = 'Invalid token';
//     statusCode = 401;
//   }

//   if (err.name === 'TokenExpiredError') {
//     userMessage = 'Token expired';
//     statusCode = 401;
//   }

//   // Database connection errors - don't expose internal details
//   if (err.code === 'ECONNREFUSED') {
//     userMessage = 'Database connection error';
//     statusCode = 503;
//   }

//   res.status(statusCode).json({
//     status: 'error',
//     message: userMessage,
//     // Only include error ID for debugging, not stack trace
//     errorId: process.env.NODE_ENV === 'development' ? require('crypto').randomBytes(8).toString('hex') : undefined
//   });
// };

// module.exports = errorHandler;




// src/middleware/errorHandler.js
const { errorResponse } = require('../utils/utils');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json(errorResponse('Duplicate entry found.', 409));
      case 'P2025':
        return res.status(404).json(errorResponse('Record not found.', 404));
      case 'P2003':
        return res.status(400).json(errorResponse('Invalid reference.', 400));
      default:
        return res.status(500).json(errorResponse('Database error occurred.'));
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(errorResponse('Invalid token.', 401));
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(errorResponse('Token expired.', 401));
  }

  // Validation errors
  if (err.isJoi) {
    return res.status(400).json(errorResponse(
      'Validation failed.',
      400,
      err.details.map(detail => detail.message)
    ));
  }

  // Default error
  res.status(500).json(errorResponse(
    process.env.NODE_ENV === 'production' 
      ? 'Internal server error.' 
      : err.message
  ));
};

module.exports = errorHandler;