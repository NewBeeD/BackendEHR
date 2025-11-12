// src/controllers/userController.js
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/utils');

const userController = {
  getAllUsers: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;

      // Build search condition
      const searchCondition = search ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { profile: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }}
        ]
      } : {};

      const where = { ...searchCondition };
      if (role) where.role = role;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: {
            profile: true,
            _count: {
              select: {
                appointments: true,
                medicalRecords: true,
                prescriptions: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: parseInt(skip),
          take: parseInt(limit)
        }),
        prisma.user.count({ where })
      ]);

      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(successResponse({
        users: usersWithoutPasswords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }));

    } catch (error) {
      next(error);
    }
  },

  getUser: async (req, res, next) => {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          profile: true,
          _count: {
            select: {
              appointments: true,
              medicalRecords: true,
              prescriptions: true,
              labResults: true
            }
          }
        }
      });

      if (!user) {
        return res.status(404).json(errorResponse('User not found'));
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      res.json(successResponse({ user: userWithoutPassword }));

    } catch (error) {
      next(error);
    }
  },

  updateUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { profile, ...userData } = req.body;

      const user = await prisma.user.findUnique({ 
        where: { id },
        include: { profile: true }
      });
      
      if (!user) {
        return res.status(404).json(errorResponse('User not found'));
      }

      // Update user and profile
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          ...userData,
          profile: profile ? {
            upsert: {
              create: profile,
              update: profile
            }
          } : undefined
        },
        include: {
          profile: true
        }
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      res.json(successResponse({ user: userWithoutPassword }, 'User updated successfully'));

    } catch (error) {
      next(error);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;

      // Prevent users from deleting themselves
      if (id === req.user.id) {
        return res.status(400).json(errorResponse('You cannot delete your own account'));
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json(errorResponse('User not found'));
      }

      await prisma.user.delete({ where: { id } });

      res.json(successResponse(null, 'User deleted successfully'));

    } catch (error) {
      next(error);
    }
  },

  getDoctors: async (req, res, next) => {
    try {
      const { specialty, search = '' } = req.query;

      const where = { role: 'Doctor' };
      
      if (specialty) {
        where.profile = { specialty };
      }

      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { profile: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }}
        ];
      }

      const doctors = await prisma.user.findMany({
        where,
        include: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
              specialty: true,
              phone: true,
              licenseNumber: true
            }
          }
        },
        orderBy: {
          profile: {
            firstName: 'asc'
          }
        }
      });

      // Remove passwords from response
      const doctorsWithoutPasswords = doctors.map(doctor => {
        const { password, ...doctorWithoutPassword } = doctor;
        return doctorWithoutPassword;
      });

      res.json(successResponse({ doctors: doctorsWithoutPasswords }));

    } catch (error) {
      next(error);
    }
  },

  getUserStats: async (req, res, next) => {
    try {
      const { id } = req.params;

      const stats = await prisma.user.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              appointments: true,
              medicalRecords: true,
              prescriptions: true,
              labResults: true,
              billing: true
            }
          },
          appointments: {
            take: 5,
            orderBy: { appointmentDate: 'desc' },
            include: {
              patient: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      if (!stats) {
        return res.status(404).json(errorResponse('User not found'));
      }

      // Remove password from response
      const { password, ...statsWithoutPassword } = stats;

      res.json(successResponse({ stats: statsWithoutPassword }));

    } catch (error) {
      next(error);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const { id } = req.params;
      const profileData = req.body;

      // Users can only update their own profile
      if (id !== req.user.id && req.user.role !== 'Admin') {
        return res.status(403).json(errorResponse('You can only update your own profile'));
      }

      const user = await prisma.user.findUnique({ 
        where: { id },
        include: { profile: true }
      });
      
      if (!user) {
        return res.status(404).json(errorResponse('User not found'));
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          profile: {
            upsert: {
              create: profileData,
              update: profileData
            }
          }
        },
        include: {
          profile: true
        }
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      res.json(successResponse({ user: userWithoutPassword }, 'Profile updated successfully'));

    } catch (error) {
      next(error);
    }
  }
};

module.exports = { userController };