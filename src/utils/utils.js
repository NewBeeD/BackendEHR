const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Password utilities
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT utilities
const generateToken = (userId, role = 'PATIENT') => {
  return jwt.sign(
    { 
      userId, 
      role,
      iss: 'ehr-system',
      aud: 'ehr-system',
      timestamp: Date.now()
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    }
  );
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Response formatting
const successResponse = (data = null, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    statusCode
  };
};

const errorResponse = (message = 'Error occurred', statusCode = 500, errors = null) => {
  return {
    success: false,
    message,
    errors,
    statusCode
  };
};

// Validation helpers
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json(errorResponse(
        'Validation failed', 
        400, 
        error.details.map(detail => detail.message)
      ));
    }
    req.validatedData = value;
    next();
  };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  successResponse,
  errorResponse,
  validateRequest
};