// // src/controllers/authController.js
// const prisma = require('../config/database');
// const {
//   hashPassword,
//   comparePassword,
//   generateToken,
//   sendEmail,
//   successResponse,
//   errorResponse
// } = require('../utils/utils');
// const { authValidation } = require('../utils/validation');
// const { generateMRN, generateEmployeeId } = require('../utils/idGenerators');

// const authController = {
  
//   register: async (req, res, next) => {
//     try {
//       const { error, value } = authValidation.register.validate(req.body);
//       if (error) {
//         return res.status(400).json(errorResponse(error.details[0].message));
//       }

//       const { email, password, firstName, lastName, role, phone, specialty, licenseNumber } = value;

//       // Check if user exists
//       const existingUser = await prisma.user.findUnique({ where: { email } });
//       if (existingUser) {
//         return res.status(400).json(errorResponse('User already exists'));
//       }

//       // Hash password
//       const hashedPassword = await hashPassword(password);

//       // Create user
//       const user = await prisma.user.create({
//         data: {
//           email,
//           password: hashedPassword,
//           role,
//           profile: {
//             create: {
//               firstName,
//               lastName,
//               phone,
//               specialty,
//               licenseNumber
//             }
//           }
//         },
//         include: {
//           profile: true
//         }
//       });

//       // Generate token
//       const token = generateToken(user.id);

//       // Remove password from response
//       const { password: _, ...userWithoutPassword } = user;

//       res.status(201).json(successResponse({
//         user: userWithoutPassword,
//         token
//       }, 'User registered successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },



//   login: async (req, res, next) => {
//     try {
//       const { error, value } = authValidation.login.validate(req.body);
//       if (error) {
//         return res.status(400).json(errorResponse(error.details[0].message));
//       }

//       const { email, password } = value;

//       // Find user
//       const user = await prisma.user.findUnique({
//         where: { email },
//         // include: { profile: true }
//       });

//       if (!user || !(await comparePassword(password, user.password))) {
//         return res.status(401).json(errorResponse('Invalid credentials'));
//       }

//       // Generate token
//       const token = generateToken(user.id);

//       // Remove password from response
//       const { password: _, ...userWithoutPassword } = user;

//       res.json(successResponse({
//         user: userWithoutPassword,
//         token
//       }, 'Login successful'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   getMe: async (req, res, next) => {
//     try {
//       const user = await prisma.user.findUnique({
//         where: { id: req.user.id },
//         include: { profile: true }
//       });

//       const { password: _, ...userWithoutPassword } = user;

//       res.json(successResponse({
//         user: userWithoutPassword
//       }));

//     } catch (error) {
//       next(error);
//     }
//   },

//   changePassword: async (req, res, next) => {
//     try {
//       const { currentPassword, newPassword } = req.body;
//       const userId = req.user.id;

//       if (!currentPassword || !newPassword) {
//         return res.status(400).json(errorResponse('Current password and new password are required'));
//       }

//       const user = await prisma.user.findUnique({ where: { id: userId } });

//       if (!user || !(await comparePassword(currentPassword, user.password))) {
//         return res.status(401).json(errorResponse('Current password is incorrect'));
//       }

//       const hashedNewPassword = await hashPassword(newPassword);

//       await prisma.user.update({
//         where: { id: userId },
//         data: { password: hashedNewPassword }
//       });

//       res.json(successResponse(null, 'Password changed successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   forgotPassword: async (req, res, next) => {
//     try {
//       const { email } = req.body;

//       const user = await prisma.user.findUnique({ where: { email } });
//       if (!user) {
//         return res.json(successResponse(null, 'If email exists, password reset instructions will be sent'));
//       }

//       // Generate reset token (simplified - in production use proper reset token mechanism)
//       const resetToken = generateToken(user.id);
//       const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

//       // Send email
//       await sendEmail(
//         email,
//         'Password Reset Request',
//         `
//         <h2>Password Reset Request</h2>
//         <p>You requested to reset your password. Click the link below to reset your password:</p>
//         <a href="${resetLink}">Reset Password</a>
//         <p>This link will expire in 1 hour.</p>
//         `
//       );

//       res.json(successResponse(null, 'Password reset instructions sent to your email'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   resetPassword: async (req, res, next) => {
//     try {
//       const { token, newPassword } = req.body;

//       if (!token || !newPassword) {
//         return res.status(400).json(errorResponse('Token and new password are required'));
//       }

//       // Verify token
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       const hashedPassword = await hashPassword(newPassword);

//       await prisma.user.update({
//         where: { id: decoded.userId },
//         data: { password: hashedPassword }
//       });

//       res.json(successResponse(null, 'Password reset successfully'));

//     } catch (error) {
//       next(error);
//     }
//   }
// };


// module.exports = { authController };



// src/controllers/authController.js
const prisma = require('../config/database');
const {
  hashPassword,
  comparePassword,
  generateToken,
  successResponse,
  errorResponse
} = require('../utils/utils');
const { generateEmployeeId } = require('../utils/idGenerators');
const { authValidation } = require('../utils/validation');

const authController = {
  
  register: async (req, res) => {
    try {
      const { error, value } = authValidation.register.validate(req.body);
      if (error) {
        return res.status(400).json(errorResponse(
          'Validation failed',
          400,
          error.details.map(detail => detail.message)
        ));
      }

      const {
        email,
        password,
        firstName,
        lastName,
        role,
        phone,
        dateOfBirth,
        address,
        department,
        specialization,
        licenseNumber
      } = value;

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json(errorResponse('User already exists with this email.', 409));
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Build user data
      const userData = {
        email,
        password: hashedPassword,
        role,
        profile: {
          create: {
            firstName,
            lastName,
            phone,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            address
          }
        }
      };

      // Create staff record for healthcare providers
      if (role !== 'PATIENT') {
        userData.staff = {
          create: {
            employeeId: await generateEmployeeId(),
            department,
            specialization: specialization || null,
            licenseNumber: licenseNumber || null
          }
        };
      }

      // Create user
      const user = await prisma.user.create({
        data: userData,
        include: {
          profile: true,
          staff: true,
          patient: true
        }
      });

      // Generate token
      const token = generateToken(user.id, user.role);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json(successResponse(
        {
          user: userWithoutPassword,
          token
        },
        'User registered successfully',
        201
      ));

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json(errorResponse('Registration failed.'));
    }
  },

  login: async (req, res) => {
    try {
      const { error, value } = authValidation.login.validate(req.body);
      if (error) {
        return res.status(400).json(errorResponse('Invalid email or password format.', 400));
      }

      const { email, password } = value;

      // Find user with related data
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          profile: true,
          staff: true,
          patient: true
        }
      });

      if (!user || !(await comparePassword(password, user.password))) {
        return res.status(401).json(errorResponse('Invalid credentials.', 401));
      }

      // Check account status
      if (user.status !== 'ACTIVE') {
        return res.status(401).json(errorResponse('Account is not active.', 401));
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Generate token
      const token = generateToken(user.id, user.role);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json(successResponse(
        {
          user: userWithoutPassword,
          token
        },
        'Login successful'
      ));

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json(errorResponse('Login failed.'));
    }
  },

  getProfile: async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          profile: true,
          staff: true,
          patient: true
        }
      });

      const { password: _, ...userWithoutPassword } = user;

      res.json(successResponse(
        { user: userWithoutPassword },
        'Profile retrieved successfully'
      ));

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json(errorResponse('Failed to retrieve profile.'));
    }
  },

  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json(errorResponse('Current password and new password are required.', 400));
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || !(await comparePassword(currentPassword, user.password))) {
        return res.status(401).json(errorResponse('Current password is incorrect.', 401));
      }

      const hashedNewPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      res.json(successResponse(null, 'Password changed successfully'));

    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json(errorResponse('Failed to change password.'));
    }
  }
};

module.exports = authController;