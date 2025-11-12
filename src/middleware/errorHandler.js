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
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Don't log sensitive information
  const safeError = {
    message: err.message,
    code: err.code,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };

  console.error('Error:', safeError);

  // Never expose PHI in error messages
  let userMessage = 'An error occurred';
  let statusCode = error.statusCode || 500;

  // Prisma errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0];
    userMessage = `Duplicate field value. Please use another value.`;
    statusCode = 400;
  }

  if (err.code === 'P2025') {
    userMessage = 'Record not found';
    statusCode = 404;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    userMessage = 'Invalid token';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    userMessage = 'Token expired';
    statusCode = 401;
  }

  // Database connection errors - don't expose internal details
  if (err.code === 'ECONNREFUSED') {
    userMessage = 'Database connection error';
    statusCode = 503;
  }

  res.status(statusCode).json({
    status: 'error',
    message: userMessage,
    // Only include error ID for debugging, not stack trace
    errorId: process.env.NODE_ENV === 'development' ? require('crypto').randomBytes(8).toString('hex') : undefined
  });
};

module.exports = errorHandler;


