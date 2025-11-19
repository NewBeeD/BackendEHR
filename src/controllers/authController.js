

// // src/controllers/authController.js
// const prisma = require('../config/database');
// const auditService = require('../services/auditService');

// const {
//   hashPassword,
//   comparePassword,
//   generateToken,
//   successResponse,
//   errorResponse
// } = require('../utils/utils');
// const { generateEmployeeId } = require('../utils/idGenerators');
// const { authValidation } = require('../utils/validation');

// const authController = {
  
//   register: async (req, res) => {
//     try {
//       const { error, value } = authValidation.register.validate(req.body);
//       if (error) {
//         return res.status(400).json(errorResponse(
//           'Validation failed',
//           400,
//           error.details.map(detail => detail.message)
//         ));
//       }

//       const {
//         email,
//         password,
//         firstName,
//         lastName,
//         role,
//         phone,
//         dateOfBirth,
//         address,
//         department,
//         specialization,
//         licenseNumber
//       } = value;

//       // Check if user exists
//       const existingUser = await prisma.user.findUnique({ where: { email } });
//       if (existingUser) {
//         return res.status(409).json(errorResponse('User already exists with this email.', 409));
//       }

//       // Hash password
//       const hashedPassword = await hashPassword(password);

//       // Build user data
//       const userData = {
//         email,
//         password: hashedPassword,
//         role,
//         profile: {
//           create: {
//             firstName,
//             lastName,
//             phone,
//             dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
//             address
//           }
//         }
//       };

//       // Create staff record for healthcare providers
//       if (role !== 'PATIENT') {
//         userData.staff = {
//           create: {
//             employeeId: await generateEmployeeId(),
//             department,
//             specialization: specialization || null,
//             licenseNumber: licenseNumber || null
//           }
//         };
//       }

//       // Create user
//       const user = await prisma.user.create({
//         data: userData,
//         include: {
//           profile: true,
//           staff: true,
//           patient: true
//         }
//       });

//       // Generate token
//       const token = generateToken(user.id, user.role);

//       // Remove password from response
//       const { password: _, ...userWithoutPassword } = user;

//       res.status(201).json(successResponse(
//         {
//           user: userWithoutPassword,
//           token
//         },
//         'User registered successfully',
//         201
//       ));

//     } catch (error) {
//       console.error('Registration error:', error);
//       res.status(500).json(errorResponse('Registration failed.'));
//     }
//   },

//   login: async (req, res) => {
    
//     try {
//       const { error, value } = authValidation.login.validate(req.body);
//       if (error) {
//         return res.status(400).json(errorResponse('Invalid email or password format.', 400));
//       }

//       const { email, password } = value;

//       // Find user with related data
//       const user = await prisma.user.findUnique({
//         where: { email },
//         include: {
//           profile: true,
//           staff: true,
//           patient: true
//         }
//       });

//       if (!user || !(await comparePassword(password, user.password))) {
//         return res.status(401).json(errorResponse('Invalid credentials.', 401));
//       }

//       // Check account status
//       if (user.status !== 'ACTIVE') {
//         return res.status(401).json(errorResponse('Account is not active.', 401));
//       }

//       // Update last login
//       await prisma.user.update({
//         where: { id: user.id },
//         data: { lastLogin: new Date() }
//       });

//       // Generate token
//       const token = generateToken(user.id, user.role);

//       // Remove password from response
//       const { password: _, ...userWithoutPassword } = user;

//       res.json(successResponse(
//         {
//           user: userWithoutPassword,
//           token
//         },
//         'Login successful'
//       ));

//     } catch (error) {
//       console.error('Login error:', error);
//       res.status(500).json(errorResponse('Login failed.'));
//     }
//   },

//   getProfile: async (req, res) => {
//     try {
//       const user = await prisma.user.findUnique({
//         where: { id: req.user.id },
//         include: {
//           profile: true,
//           staff: true,
//           patient: true
//         }
//       });

//       const { password: _, ...userWithoutPassword } = user;

//       res.json(successResponse(
//         { user: userWithoutPassword },
//         'Profile retrieved successfully'
//       ));

//     } catch (error) {
//       console.error('Get profile error:', error);
//       res.status(500).json(errorResponse('Failed to retrieve profile.'));
//     }
//   },

//   changePassword: async (req, res) => {
//     try {
//       const { currentPassword, newPassword } = req.body;
//       const userId = req.user.id;

//       if (!currentPassword || !newPassword) {
//         return res.status(400).json(errorResponse('Current password and new password are required.', 400));
//       }

//       const user = await prisma.user.findUnique({ where: { id: userId } });

//       if (!user || !(await comparePassword(currentPassword, user.password))) {
//         return res.status(401).json(errorResponse('Current password is incorrect.', 401));
//       }

//       const hashedNewPassword = await hashPassword(newPassword);

//       await prisma.user.update({
//         where: { id: userId },
//         data: { password: hashedNewPassword }
//       });

//       res.json(successResponse(null, 'Password changed successfully'));

//     } catch (error) {
//       console.error('Change password error:', error);
//       res.status(500).json(errorResponse('Failed to change password.'));
//     }
//   }
// };

// module.exports = authController;





// src/controllers/authController.js
const prisma = require('../config/database');
const auditService = require('../services/auditService');

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
        // Log failed registration attempt
        await auditService.log('REGISTER_FAILED', 'User', {
          userId: null,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Registration failed - user already exists: ${email}`
        });
        
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

      // ✅ AUDIT: Log successful registration
      await auditService.logPHICreation('User', user.id, user, req, userWithoutPassword);

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
      
      // ✅ AUDIT: Log registration error
      await auditService.log('REGISTER_ERROR', 'User', {
        userId: null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Registration error: ${error.message}`
      });
      
      res.status(500).json(errorResponse('Registration failed.'));
    }
  },

  login: async (req, res) => {
    try {
      const { error, value } = authValidation.login.validate(req.body);
      
      if (error) {
        // ✅ AUDIT: Log failed login validation
        await auditService.logAuthentication('LOGIN_VALIDATION_FAILED', null, req, false);
        
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
        // ✅ AUDIT: Log failed login attempt
        await auditService.logAuthentication('LOGIN_FAILED', null, req, false);
        
        return res.status(401).json(errorResponse('Invalid credentials.', 401));
      }

      // Check account status
      if (user.status !== 'ACTIVE') {
        // ✅ AUDIT: Log login attempt to inactive account
        await auditService.logAuthentication('LOGIN_INACTIVE_ACCOUNT', user, req, false);
        
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

      // ✅ AUDIT: Log successful login
      await auditService.logAuthentication('LOGIN_SUCCESS', user, req, true);

      res.json(successResponse(
        {
          user: userWithoutPassword,
          token
        },
        'Login successful'
      ));

    } catch (error) {
      console.error('Login error:', error);
      
      // ✅ AUDIT: Log login error
      await auditService.logAuthentication('LOGIN_ERROR', null, req, false);
      
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

      // ✅ AUDIT: Log profile access
      await auditService.log('PROFILE_ACCESS', 'User', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: 'Accessed own profile'
      });

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
        // ✅ AUDIT: Log failed password change attempt
        await auditService.log('PASSWORD_CHANGE_FAILED', 'User', {
          userId: userId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: 'Failed password change - incorrect current password'
        });
        
        return res.status(401).json(errorResponse('Current password is incorrect.', 401));
      }

      const hashedNewPassword = await hashPassword(newPassword);

      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      // ✅ AUDIT: Log successful password change
      await auditService.log('PASSWORD_CHANGE_SUCCESS', 'User', {
        userId: userId,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: 'Password changed successfully'
      });

      res.json(successResponse(null, 'Password changed successfully'));

    } catch (error) {
      console.error('Change password error:', error);
      
      // ✅ AUDIT: Log password change error
      await auditService.log('PASSWORD_CHANGE_ERROR', 'User', {
        userId: req.user?.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Password change error: ${error.message}`
      });
      
      res.status(500).json(errorResponse('Failed to change password.'));
    }
  }
};

module.exports = authController;