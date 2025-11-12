// src/controllers/authController.js
const prisma = require('../config/database');
const {
  hashPassword,
  comparePassword,
  generateToken,
  sendEmail,
  successResponse,
  errorResponse
} = require('../utils/utils');
const { authValidation } = require('../utils/validation');

const authController = {
  register: async (req, res, next) => {
    try {
      const { error, value } = authValidation.register.validate(req.body);
      if (error) {
        return res.status(400).json(errorResponse(error.details[0].message));
      }

      const { email, password, firstName, lastName, role, phone, specialty, licenseNumber } = value;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json(errorResponse('User already exists'));
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          profile: {
            create: {
              firstName,
              lastName,
              phone,
              specialty,
              licenseNumber
            }
          }
        },
        include: {
          profile: true
        }
      });

      // Generate token
      const token = generateToken(user.id);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json(successResponse({
        user: userWithoutPassword,
        token
      }, 'User registered successfully'));

    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { error, value } = authValidation.login.validate(req.body);
      if (error) {
        return res.status(400).json(errorResponse(error.details[0].message));
      }

      const { email, password } = value;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true }
      });

      if (!user || !(await comparePassword(password, user.password))) {
        return res.status(401).json(errorResponse('Invalid credentials'));
      }

      // Generate token
      const token = generateToken(user.id);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json(successResponse({
        user: userWithoutPassword,
        token
      }, 'Login successful'));

    } catch (error) {
      next(error);
    }
  },

  getMe: async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { profile: true }
      });

      const { password: _, ...userWithoutPassword } = user;

      res.json(successResponse({
        user: userWithoutPassword
      }));

    } catch (error) {
      next(error);
    }
  },

  changePassword: async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json(errorResponse('Current password and new password are required'));
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || !(await comparePassword(currentPassword, user.password))) {
        return res.status(401).json(errorResponse('Current password is incorrect'));
      }

      const hashedNewPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      res.json(successResponse(null, 'Password changed successfully'));

    } catch (error) {
      next(error);
    }
  },

  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.json(successResponse(null, 'If email exists, password reset instructions will be sent'));
      }

      // Generate reset token (simplified - in production use proper reset token mechanism)
      const resetToken = generateToken(user.id);
      const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

      // Send email
      await sendEmail(
        email,
        'Password Reset Request',
        `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        `
      );

      res.json(successResponse(null, 'Password reset instructions sent to your email'));

    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json(errorResponse('Token and new password are required'));
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const hashedPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: decoded.userId },
        data: { password: hashedPassword }
      });

      res.json(successResponse(null, 'Password reset successfully'));

    } catch (error) {
      next(error);
    }
  }
};

module.exports = { authController };