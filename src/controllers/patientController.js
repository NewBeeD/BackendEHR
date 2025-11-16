// src/controllers/patientsController.js
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/utils');
const { generateMRN } = require('../utils/idGenerators');
const { patientValidation } = require('../utils/validation');

const patientsController = {
  createPatient: async (req, res) => {
    try {
      const { error, value } = patientValidation.create.validate(req.body);
      if (error) {
        return res.status(400).json(errorResponse(
          'Validation failed',
          400,
          error.details.map(detail => detail.message)
        ));
      }

      const {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        phone,
        email,
        address,
        bloodType,
        allergies,
        medications,
        conditions,
        emergencyContact,
        insurance
      } = value;

      // Check for existing patient by email if provided
      if (email) {
        const existingPatient = await prisma.patient.findUnique({
          where: { email }
        });

        if (existingPatient) {
          return res.status(409).json(errorResponse('Patient already exists with this email.', 409));
        }
      }

      // Generate MRN
      const mrn = await generateMRN();

      // Create patient
      const patient = await prisma.patient.create({
        data: {
          mrn,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          phone,
          email,
          address,
          bloodType,
          allergies,
          medications,
          conditions,
          createdBy: {
            connect: { id: req.user.id }
          },
          // Create related records if provided
          ...(emergencyContact && {
            emergencyContact: {
              create: emergencyContact
            }
          }),
          ...(insurance && {
            insurance: {
              create: {
                ...insurance,
                effectiveDate: new Date(insurance.effectiveDate),
                expirationDate: insurance.expirationDate ? new Date(insurance.expirationDate) : null
              }
            }
          })
        },
        include: {
          emergencyContact: true,
          insurance: true,
          allergiesList: true
        }
      });

      // Log the creation
      await prisma.accessLog.create({
        data: {
          userId: req.user.id,
          action: 'CREATE',
          resource: 'PATIENT',
          resourceId: patient.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.status(201).json(successResponse(
        { patient },
        'Patient created successfully',
        201
      ));

    } catch (error) {
      console.error('Create patient error:', error);
      res.status(500).json(errorResponse('Failed to create patient.'));
    }
  },

  getPatients: async (req, res) => {
    try {
      const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      let where = {};

      // Search functionality
      if (search) {
        where = {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { mrn: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
          ]
        };
      }

      const patients = await prisma.patient.findMany({
        where,
        skip,
        take,
        include: {
          emergencyContact: true,
          insurance: true,
          allergiesList: true,
          _count: {
            select: {
              appointments: true,
              medicalRecords: true,
              prescriptions: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder }
      });

      const total = await prisma.patient.count({ where });

      res.json(successResponse({
        patients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }));

    } catch (error) {
      console.error('Get patients error:', error);
      res.status(500).json(errorResponse('Failed to retrieve patients.'));
    }
  },

  getPatient: async (req, res) => {
    try {
      const { id } = req.params;

      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          emergencyContact: true,
          insurance: true,
          allergiesList: true,
          appointments: {
            include: {
              provider: {
                include: {
                  profile: true
                }
              }
            },
            orderBy: { appointmentDate: 'desc' }
          },
          medicalRecords: {
            include: {
              provider: {
                include: {
                  profile: true
                }
              },
              prescriptions: true,
              labResults: true,
              diagnoses: true
            },
            orderBy: { visitDate: 'desc' }
          },
          prescriptions: {
            include: {
              provider: {
                include: {
                  profile: true
                }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          labResults: {
            orderBy: { reportedAt: 'desc' }
          },
          vitalSigns: {
            orderBy: { recordedAt: 'desc' },
            take: 10
          }
        }
      });

      if (!patient) {
        return res.status(404).json(errorResponse('Patient not found.', 404));
      }

      // Log access
      await prisma.accessLog.create({
        data: {
          userId: req.user.id,
          action: 'VIEW',
          resource: 'PATIENT',
          resourceId: patient.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.json(successResponse({ patient }));

    } catch (error) {
      console.error('Get patient error:', error);
      res.status(500).json(errorResponse('Failed to retrieve patient.'));
    }
  },

  updatePatient: async (req, res) => {
    try {
      const { id } = req.params;
      const { error, value } = patientValidation.update.validate(req.body);
      
      if (error) {
        return res.status(400).json(errorResponse(
          'Validation failed',
          400,
          error.details.map(detail => detail.message)
        ));
      }

      const patient = await prisma.patient.update({
        where: { id },
        data: value,
        include: {
          emergencyContact: true,
          insurance: true,
          allergiesList: true
        }
      });

      // Log update
      await prisma.accessLog.create({
        data: {
          userId: req.user.id,
          action: 'UPDATE',
          resource: 'PATIENT',
          resourceId: patient.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.json(successResponse({ patient }, 'Patient updated successfully'));

    } catch (error) {
      console.error('Update patient error:', error);
      res.status(500).json(errorResponse('Failed to update patient.'));
    }
  }
};

module.exports = patientsController;