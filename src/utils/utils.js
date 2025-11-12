// src/utils/utils.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Password hashing
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// JWT token generation
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Send email
const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"EHR System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

// Generate patient ID
const generatePatientId = async (prisma) => {
  const lastPatient = await prisma.patient.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  let nextNumber = 1;
  if (lastPatient && lastPatient.patientId) {
    const lastNumber = parseInt(lastPatient.patientId.replace('MR', ''));
    nextNumber = lastNumber + 1;
  }

  return `MR${nextNumber.toString().padStart(4, '0')}`;
};

// Format response
const successResponse = (data, message = 'Success') => ({
  status: 'success',
  message,
  data
});

const errorResponse = (message = 'Error') => ({
  status: 'error',
  message
});

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  sendEmail,
  generatePatientId,
  successResponse,
  errorResponse
};