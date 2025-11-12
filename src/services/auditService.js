// src/services/auditService.js
const prisma = require('../config/database');

const auditService = {
  log: async (action, resource, options = {}) => {
    try {
      const {
        resourceId = null,
        userId = null,
        userEmail = null,
        userRole = null,
        ipAddress = null,
        userAgent = null,
        oldValues = null,
        newValues = null,
        severity = 'Info',
        description = null
      } = options;

      await prisma.auditLog.create({
        data: {
          action,
          resource,
          resourceId,
          userId,
          userEmail,
          userRole,
          ipAddress,
          userAgent,
          oldValues,
          newValues,
          severity,
          description
        }
      });
    } catch (error) {
      console.error('Audit log failed:', error);
      // Don't throw error as audit failure shouldn't break main functionality
    }
  },

  // Specific audit actions for HIPAA compliance
  logPHIAccess: async (resource, resourceId, user, req) => {
    await auditService.log('READ', resource, {
      resourceId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      description: `Accessed ${resource} record`,
      severity: 'Info'
    });
  },

  logPHIModification: async (action, resource, resourceId, user, req, oldValues = null, newValues = null) => {
    await auditService.log(action, resource, {
      resourceId,
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      oldValues,
      newValues,
      description: `${action} ${resource} record`,
      severity: action === 'DELETE' ? 'Warning' : 'Info'
    });
  },

  logAuthentication: async (action, user, req, success = true) => {
    await auditService.log(action, 'Authentication', {
      userId: user?.id,
      userEmail: user?.email,
      userRole: user?.role,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      description: `${action} ${success ? 'successful' : 'failed'}`,
      severity: success ? 'Info' : 'Warning'
    });
  }
};

module.exports = auditService;