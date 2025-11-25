// // src/services/auditService.js
// const prisma = require('../config/database');

// const auditService = {
//   log: async (action, resource, options = {}) => {
//     try {
//       const {
//         resourceId = null,
//         userId = null,
//         userEmail = null,
//         userRole = null,
//         ipAddress = null,
//         userAgent = null,
//         oldValues = null,
//         newValues = null,
//         severity = 'Info',
//         description = null
//       } = options;

//       await prisma.auditLog.create({
//         data: {
//           action,
//           resource,
//           resourceId,
//           userId,
//           userEmail,
//           userRole,
//           ipAddress,
//           userAgent,
//           oldValues,
//           newValues,
//           severity,
//           description
//         }
//       });
//     } catch (error) {
//       console.error('Audit log failed:', error);
//       // Don't throw error as audit failure shouldn't break main functionality
//     }
//   },

//   // Specific audit actions for HIPAA compliance
//   logPHIAccess: async (resource, resourceId, user, req) => {
//     await auditService.log('READ', resource, {
//       resourceId,
//       userId: user.id,
//       userEmail: user.email,
//       userRole: user.role,
//       ipAddress: req.ip,
//       userAgent: req.get('User-Agent'),
//       description: `Accessed ${resource} record`,
//       severity: 'Info'
//     });
//   },

//   logPHIModification: async (action, resource, resourceId, user, req, oldValues = null, newValues = null) => {
//     await auditService.log(action, resource, {
//       resourceId,
//       userId: user.id,
//       userEmail: user.email,
//       userRole: user.role,
//       ipAddress: req.ip,
//       userAgent: req.get('User-Agent'),
//       oldValues,
//       newValues,
//       description: `${action} ${resource} record`,
//       severity: action === 'DELETE' ? 'Warning' : 'Info'
//     });
//   },

//   logAuthentication: async (action, user, req, success = true) => {
//     await auditService.log(action, 'Authentication', {
//       userId: user?.id,
//       userEmail: user?.email,
//       userRole: user?.role,
//       ipAddress: req.ip,
//       userAgent: req.get('User-Agent'),
//       description: `${action} ${success ? 'successful' : 'failed'}`,
//       severity: success ? 'Info' : 'Warning'
//     });
//   }
// };

// module.exports = auditService;



// src/services/auditService.js
const prisma = require('../config/database');

const auditService = {
  
  // log: async (action, tableName, options = {}) => {
    
  //   try {
      
  //     const {
  //       recordId = null,
  //       userId = null,
  //       ipAddress = null,
  //       userAgent = null,
  //       oldValues = null,
  //       newValues = null,
  //       description = null
  //     } = options;

  //     await prisma.auditLog.create({
  //       data: {
  //         userId,
  //         action,
  //         tableName,
  //         recordId,
  //         oldValues,
  //         newValues,
  //         ipAddress,
  //         userAgent,
  //         description
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Audit log failed:', error);
  //     // Don't throw error as audit failure shouldn't break main functionality
  //   }
  // },


    log: async (action, tableName, options = {}) => {
    try {
      const {
        recordId = null,
        userId = null,
        ipAddress = null,
        userAgent = null,
        oldValues = null,
        newValues = null,
        description = null
      } = options;

      const data = {
        action,
        tableName,
        oldValues,
        newValues,
        ipAddress,
        userAgent,
        description
      };

      // Use relation instead of userId field
      if (userId) {
        data.user = {
          connect: { id: userId }
        };
      }

      // Handle recordId - ensure it's never null
      if (recordId) {
        data.recordId = recordId;
      } else {
        // For authentication events without a specific record, use userId or system
        data.recordId = userId || 'system';
      }

      await prisma.auditLog.create({
        data
      });
    } catch (error) {
      console.error('Audit log failed:', error);
      // Don't throw error as audit failure shouldn't break main functionality
    }
  },

  // Specific audit actions for HIPAA compliance
  logPHIAccess: async (tableName, recordId, user, req) => {
    await auditService.log('VIEW', tableName, {
      recordId,
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      description: `Accessed ${tableName} record`
    });
  },

  logPHICreation: async (tableName, recordId, user, req, newValues = null) => {
    await auditService.log('CREATE', tableName, {
      recordId,
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      newValues,
      description: `Created ${tableName} record`
    });
  },

  logPHIUpdate: async (tableName, recordId, user, req, oldValues = null, newValues = null) => {
    await auditService.log('UPDATE', tableName, {
      recordId,
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      oldValues,
      newValues,
      description: `Updated ${tableName} record`
    });
  },

  logPHIDeletion: async (tableName, recordId, user, req, oldValues = null) => {
    await auditService.log('DELETE', tableName, {
      recordId,
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      oldValues,
      description: `Deleted ${tableName} record`
    });
  },

  logAuthentication: async (action, user, req, success = true) => {
    await auditService.log(action, 'Authentication', {
      userId: user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      description: `${action} ${success ? 'successful' : 'failed'}`
    });
  },

  logAuthorization: async (action, user, req, resource) => {
    await auditService.log(action, 'Authorization', {
      userId: user?.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      description: `${action} access to ${resource}`
    });
  }
};

module.exports = auditService;