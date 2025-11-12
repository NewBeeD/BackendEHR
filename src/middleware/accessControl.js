// src/middleware/accessControl.js
const prisma = require('../config/database');
const auditService = require('../services/auditService');

// Main access control middleware
const checkAccess = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const user = req.user;

      // If user is the patient themselves, allow access
      if (user.role === 'Patient' && patientId === user.id) {
        return next();
      }

      // If user is primary care provider or has admin role
      if (user.role === 'Admin' || await isPrimaryProvider(user.id, patientId)) {
        return next();
      }

      // Check for active access grants
      const hasAccess = await checkAccessGrant(user.id, patientId, requiredPermissions);
      
      if (!hasAccess) {
        await auditService.log('ACCESS_DENIED', 'Patient', {
          userId: user.id,
          userEmail: user.email,
          userRole: user.role,
          resourceId: patientId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Attempted to access patient ${patientId} without proper permissions`,
          severity: 'Warning'
        });

        return res.status(403).json({
          status: 'error',
          message: 'Access denied. No valid access grant found for this patient.'
        });
      }

      // Log successful access
      await auditService.log('ACCESS_GRANTED', 'Patient', {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        resourceId: patientId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Accessed patient ${patientId} via access grant`,
        severity: 'Info'
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Check if user is primary provider for patient
const isPrimaryProvider = async (providerId, patientId) => {
  // This could be enhanced with a dedicated primary provider relationship
  const recentAppointments = await prisma.appointment.count({
    where: {
      patientId,
      doctorId: providerId,
      status: 'Completed',
      appointmentDate: {
        gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
      }
    }
  });

  return recentAppointments > 0;
};

// Check access grant validity and permissions
const checkAccessGrant = async (providerId, patientId, requiredPermissions = []) => {
  const now = new Date();

  const accessGrant = await prisma.accessGrant.findFirst({
    where: {
      providerId,
      patientId,
      status: 'ACTIVE',
      expiresAt: { gt: now }
    },
    include: {
      permissions: true
    }
  });

  if (!accessGrant) {
    return false;
  }

  // Check if required permissions are granted
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requiredPermissions.every(permission => 
      accessGrant.permissions.includes(permission) || 
      accessGrant.permissions.includes('FULL_ACCESS')
    );

    if (!hasRequiredPermissions) {
      return false;
    }
  }

  // Update access log
  await prisma.accessGrant.update({
    where: { id: accessGrant.id },
    data: {
      lastAccessedAt: now,
      accessCount: { increment: 1 }
    }
  });

  // Create access log entry
  await prisma.accessLog.create({
    data: {
      accessGrantId: accessGrant.id,
      action: 'ACCESS',
      resource: 'Patient',
      resourceId: patientId,
      ipAddress: req?.ip,
      userAgent: req?.get('User-Agent')
    }
  });

  return true;
};

// Token-based access for emergency situations
const checkTokenAccess = async (req, res, next) => {
  try {
    const { accessToken } = req.params;
    const { patientId } = req.params;

    if (!accessToken) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token required'
      });
    }

    const accessGrant = await prisma.accessGrant.findFirst({
      where: {
        accessToken,
        patientId,
        status: 'ACTIVE',
        expiresAt: { gt: new Date() }
      }
    });

    if (!accessGrant) {
      return res.status(403).json({
        status: 'error',
        message: 'Invalid or expired access token'
      });
    }

    // Add grant info to request for auditing
    req.accessGrant = accessGrant;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkAccess,
  checkTokenAccess,
  isPrimaryProvider,
  checkAccessGrant
};