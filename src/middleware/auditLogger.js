// src/middleware/auditLogger.js
const auditService = require('../services/auditService');

// Middleware to automatically log access to PHI
const auditAccess = (tableName) => {
  return async (req, res, next) => {
    // Store original JSON function
    const originalJson = res.json;
    
    res.json = function(data) {
      // Only log successful GET requests that return data
      if (req.method === 'GET' && res.statusCode >= 200 && res.statusCode < 300) {
        try {
          // Extract record ID from request
          let recordId = req.params.id;
          
          // If it's a list endpoint, we can't log individual records
          if (recordId && req.user) {
            auditService.logPHIAccess(tableName, recordId, req.user, req)
              .catch(error => console.error('Access audit failed:', error));
          }
        } catch (error) {
          console.error('Access audit middleware error:', error);
        }
      }
      
      // Call original JSON function
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Middleware to log modifications (POST, PUT, DELETE)
const auditModification = (tableName, action) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = async function(data) {
      // Only log successful modifications
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          if (req.user) {
            let recordId = req.params.id || data?.data?.id || data?.id;
            let newValues = null;
            let oldValues = null;
            
            switch (action) {
              case 'CREATE':
                newValues = data?.data || data;
                await auditService.logPHICreation(tableName, recordId, req.user, req, newValues);
                break;
              case 'UPDATE':
                newValues = req.body;
                // Note: For updates, you'd need to fetch old values separately
                await auditService.logPHIUpdate(tableName, recordId, req.user, req, oldValues, newValues);
                break;
              case 'DELETE':
                await auditService.logPHIDeletion(tableName, recordId, req.user, req, oldValues);
                break;
            }
          }
        } catch (error) {
          console.error('Modification audit failed:', error);
        }
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  auditAccess,
  auditModification
};