// src/services/accessCleanupService.js
const prisma = require('../config/database');
const cron = require('node-cron');

const accessCleanupService = {
  // Clean up expired access grants
  cleanupExpiredGrants: async () => {
    try {
      const now = new Date();
      
      const expiredGrants = await prisma.accessGrant.updateMany({
        where: {
          status: 'ACTIVE',
          expiresAt: { lt: now }
        },
        data: {
          status: 'EXPIRED'
        }
      });

      const expiredRequests = await prisma.accessRequest.updateMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: now }
        },
        data: {
          status: 'EXPIRED'
        }
      });

      console.log(`Cleaned up ${expiredGrants.count} expired access grants and ${expiredRequests.count} expired requests`);
    } catch (error) {
      console.error('Access cleanup error:', error);
    }
  },

  // Start scheduled cleanup (runs daily at 2 AM)
  startScheduledCleanup: () => {
    cron.schedule('0 2 * * *', accessCleanupService.cleanupExpiredGrants);
    console.log('Access grant cleanup scheduler started');
  }
};

module.exports = accessCleanupService;