// src/config/security.js
const crypto = require('crypto');

// Encryption key for PHI (store in secure key management system in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const IV_LENGTH = 16;

const securityConfig = {
  // Session timeout for automatic logoff (HIPAA requirement)
  sessionTimeout: 15 * 60 * 1000, // 15 minutes
  
  // Password policy
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90 // days
  },
  
  // API rate limiting
  rateLimits: {
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 5
    },
    general: {
      windowMs: 15 * 60 * 1000,
      max: 100
    },
    sensitive: {
      windowMs: 15 * 60 * 1000,
      max: 10
    }
  }
};

// Encryption functions for PHI
const encrypt = (text) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString('hex'),
    data: encrypted,
    authTag: authTag.toString('hex')
  };
};

const decrypt = (encryptedData) => {
  const iv = Buffer.from(encryptedData.iv, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = {
  securityConfig,
  encrypt,
  decrypt
};