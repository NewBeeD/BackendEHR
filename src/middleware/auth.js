// // src/middleware/auth.js
// const jwt = require('jsonwebtoken');
// const prisma = require('../config/database');

// const auth = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
    
//     if (!token) {
//       return res.status(401).json({
//         status: 'error',
//         message: 'Access denied. No token provided.'
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await prisma.user.findUnique({
//       where: { id: decoded.userId },
//       include: { profile: true }
//     });

//     if (!user) {
//       return res.status(401).json({
//         status: 'error',
//         message: 'Invalid token. User not found.'
//       });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     res.status(401).json({
//       status: 'error',
//       message: 'Invalid token'
//     });
//   }
// };

// const authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({
//         status: 'error',
//         message: 'Access denied. Insufficient permissions.'
//       });
//     }
//     next();
//   };
// };

// module.exports = { auth, authorize };



// src/middleware/auth.js - Enhanced version
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const auditService = require('../services/auditService');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      await auditService.logAuthentication('ACCESS_DENIED', null, req, false);
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is in blacklist (for logout)
    const blacklisted = await prisma.tokenBlacklist.findUnique({
      where: { token }
    });
    
    if (blacklisted) {
      await auditService.logAuthentication('ACCESS_DENIED_BLACKLISTED', null, req, false);
      return res.status(401).json({
        status: 'error',
        message: 'Token invalidated. Please login again.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { profile: true }
    });

    if (!user) {
      await auditService.logAuthentication('ACCESS_DENIED_USER_NOT_FOUND', null, req, false);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. User not found.'
      });
    }

    // Check if user account is active
    if (user.status !== 'Active') {
      await auditService.logAuthentication('ACCESS_DENIED_INACTIVE', user, req, false);
      return res.status(401).json({
        status: 'error',
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    req.user = user;
    req.token = token;

    // Log successful access
    await auditService.logAuthentication('ACCESS_GRANTED', user, req, true);

    next();
  } catch (error) {
    await auditService.logAuthentication('ACCESS_DENIED_INVALID_TOKEN', null, req, false);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired. Please login again.'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token.'
      });
    }

    res.status(401).json({
      status: 'error',
      message: 'Authentication failed'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      auditService.log('UNAUTHORIZED_ACCESS', 'Authorization', {
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Attempted to access ${req.method} ${req.originalUrl}`,
        severity: 'Warning'
      });
      
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Insufficient permissions.'
      });
    }
    next();
  };
};

// HIPAA: Minimum Necessary Rule - Users should only access data needed for their role
const minimumNecessary = (resourceType) => {
  return async (req, res, next) => {
    try {
      // For patients, they should only access their own data
      if (req.user.role === 'Patient') {
        if (resourceType === 'Patient' && req.params.id !== req.user.id) {
          return res.status(403).json({
            status: 'error',
            message: 'Access denied. Patients can only access their own records.'
          });
        }
        
        // Add more resource-specific checks as needed
      }
      
      // For healthcare providers, implement additional scope checks
      if (['Doctor', 'Nurse'].includes(req.user.role)) {
        // Could implement department-based or patient-assignment-based access
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { auth, authorize, minimumNecessary };