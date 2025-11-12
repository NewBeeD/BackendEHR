// // src/controllers/patientController.js
// const prisma = require('../config/database');
// const { patientValidation } = require('../utils/validation');
// const { generatePatientId, successResponse, errorResponse } = require('../utils/utils');

// const patientController = {
//   getAllPatients: async (req, res, next) => {
//     try {
//       const {
//         page = 1,
//         limit = 10,
//         search = '',
//         sortBy = 'createdAt',
//         sortOrder = 'desc'
//       } = req.query;

//       const skip = (page - 1) * limit;

//       // Build search condition
//       const searchCondition = search ? {
//         OR: [
//           { firstName: { contains: search, mode: 'insensitive' } },
//           { lastName: { contains: search, mode: 'insensitive' } },
//           { email: { contains: search, mode: 'insensitive' } },
//           { patientId: { contains: search, mode: 'insensitive' } }
//         ]
//       } : {};

//       const [patients, total] = await Promise.all([
//         prisma.patient.findMany({
//           where: searchCondition,
//           include: {
//             emergencyContact: true,
//             insurance: true,
//             _count: {
//               select: {
//                 appointments: true,
//                 medicalRecords: true
//               }
//             }
//           },
//           orderBy: { [sortBy]: sortOrder },
//           skip: parseInt(skip),
//           take: parseInt(limit)
//         }),
//         prisma.patient.count({ where: searchCondition })
//       ]);

//       res.json(successResponse({
//         patients,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       }));

//     } catch (error) {
//       next(error);
//     }
//   },

//   getPatient: async (req, res, next) => {
//     try {
//       const { id } = req.params;

//       const patient = await prisma.patient.findUnique({
//         where: { id },
//         include: {
//           emergencyContact: true,
//           insurance: true,
//           appointments: {
//             include: {
//               doctor: {
//                 include: { profile: true }
//               }
//             },
//             orderBy: { appointmentDate: 'desc' }
//           },
//           medicalRecords: {
//             include: {
//               doctor: {
//                 include: { profile: true }
//               }
//             },
//             orderBy: { visitDate: 'desc' }
//           },
//           prescriptions: {
//             include: {
//               doctor: {
//                 include: { profile: true }
//               }
//             },
//             orderBy: { createdAt: 'desc' }
//           },
//           labResults: {
//             include: {
//               doctor: {
//                 include: { profile: true }
//               }
//             },
//             orderBy: { reportedAt: 'desc' }
//           },
//           vitalSigns: {
//             orderBy: { recordedAt: 'desc' },
//             take: 10
//           }
//         }
//       });

//       if (!patient) {
//         return res.status(404).json(errorResponse('Patient not found'));
//       }

//       res.json(successResponse({ patient }));

//     } catch (error) {
//       next(error);
//     }
//   },

//   createPatient: async (req, res, next) => {
//     try {
//       const { error, value } = patientValidation.create.validate(req.body);
//       if (error) {
//         return res.status(400).json(errorResponse(error.details[0].message));
//       }

//       const patientId = await generatePatientId(prisma);

//       const patient = await prisma.patient.create({
//         data: {
//           patientId,
//           ...value,
//           emergencyContact: value.emergencyContact ? {
//             create: value.emergencyContact
//           } : undefined,
//           insurance: value.insurance ? {
//             create: value.insurance
//           } : undefined
//         },
//         include: {
//           emergencyContact: true,
//           insurance: true
//         }
//       });

//       res.status(201).json(successResponse({ patient }, 'Patient created successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   updatePatient: async (req, res, next) => {
//     try {
//       const { id } = req.params;
//       const { error, value } = patientValidation.update.validate(req.body);
//       if (error) {
//         return res.status(400).json(errorResponse(error.details[0].message));
//       }

//       const patient = await prisma.patient.findUnique({ where: { id } });
//       if (!patient) {
//         return res.status(404).json(errorResponse('Patient not found'));
//       }

//       const updatedPatient = await prisma.patient.update({
//         where: { id },
//         data: value,
//         include: {
//           emergencyContact: true,
//           insurance: true
//         }
//       });

//       res.json(successResponse({ patient: updatedPatient }, 'Patient updated successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   deletePatient: async (req, res, next) => {
//     try {
//       const { id } = req.params;

//       const patient = await prisma.patient.findUnique({ where: { id } });
//       if (!patient) {
//         return res.status(404).json(errorResponse('Patient not found'));
//       }

//       await prisma.patient.delete({ where: { id } });

//       res.json(successResponse(null, 'Patient deleted successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   getMedicalHistory: async (req, res, next) => {
//     try {
//       const { id } = req.params;

//       const medicalHistory = await prisma.medicalRecord.findMany({
//         where: { patientId: id },
//         include: {
//           doctor: {
//             include: { profile: true }
//           },
//           prescriptions: true
//         },
//         orderBy: { visitDate: 'desc' }
//       });

//       res.json(successResponse({ medicalHistory }));

//     } catch (error) {
//       next(error);
//     }
//   },

//   getPatientAppointments: async (req, res, next) => {
//     try {
//       const { id } = req.params;

//       const appointments = await prisma.appointment.findMany({
//         where: { patientId: id },
//         include: {
//           doctor: {
//             include: { profile: true }
//           }
//         },
//         orderBy: { appointmentDate: 'desc' }
//       });

//       res.json(successResponse({ appointments }));

//     } catch (error) {
//       next(error);
//     }
//   }
// };

// module.exports = { patientController };





// src/controllers/patientController.js - HIPAA Enhanced
const prisma = require('../config/database');
const { patientValidation } = require('../utils/validation');
const { generatePatientId, successResponse, errorResponse } = require('../utils/utils');
const auditService = require('../services/auditService');
const { encrypt, decrypt } = require('../config/security');

const patientController = {
  getAllPatients: async (req, res, next) => {
    try {
      // Log the access
      await auditService.log('SEARCH', 'Patient', {
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Searched patients with query: ${req.query.search || 'none'}`,
        severity: 'Info'
      });

      const {
        page = 1,
        limit = 10,
        search = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;

      const searchCondition = search ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { patientId: { contains: search, mode: 'insensitive' } }
          // Note: We don't search by email/phone for privacy
        ]
      } : {};

      const [patients, total] = await Promise.all([
        prisma.patient.findMany({
          where: searchCondition,
          select: {
            // Only return non-sensitive fields for list view
            id: true,
            patientId: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true,
            createdAt: true,
            _count: {
              select: {
                appointments: true,
                medicalRecords: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: parseInt(skip),
          take: parseInt(limit)
        }),
        prisma.patient.count({ where: searchCondition })
      ]);

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
      next(error);
    }
  },

  getPatient: async (req, res, next) => {
    try {
      const { id } = req.params;

      const patient = await prisma.patient.findUnique({
        where: { id },
        include: {
          emergencyContact: true,
          insurance: true,
          appointments: {
            include: {
              doctor: {
                include: { profile: true }
              }
            },
            orderBy: { appointmentDate: 'desc' }
          },
          medicalRecords: {
            include: {
              doctor: {
                include: { profile: true }
              }
            },
            orderBy: { visitDate: 'desc' }
          },
          prescriptions: {
            include: {
              doctor: {
                include: { profile: true }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          labResults: {
            include: {
              doctor: {
                include: { profile: true }
              }
            },
            orderBy: { reportedAt: 'desc' }
          },
          vitalSigns: {
            orderBy: { recordedAt: 'desc' },
            take: 10
          }
        }
      });

      if (!patient) {
        return res.status(404).json(errorResponse('Patient not found'));
      }

      // Log PHI access
      await auditService.logPHIAccess('Patient', id, req.user, req);

      res.json(successResponse({ patient }));

    } catch (error) {
      next(error);
    }
  },

  createPatient: async (req, res, next) => {
    try {
      const { error, value } = patientValidation.create.validate(req.body);
      if (error) {
        return res.status(400).json(errorResponse(error.details[0].message));
      }

      const patientId = await generatePatientId(prisma);

      // Encrypt sensitive data before storage
      const encryptedData = {
        ...value,
        // In production, encrypt sensitive fields like:
        // email: encrypt(value.email),
        // phone: encrypt(value.phone),
        // address: encrypt(value.address)
      };

      const patient = await prisma.patient.create({
        data: {
          patientId,
          ...encryptedData,
          emergencyContact: value.emergencyContact ? {
            create: value.emergencyContact
          } : undefined,
          insurance: value.insurance ? {
            create: value.insurance
          } : undefined
        },
        include: {
          emergencyContact: true,
          insurance: true
        }
      });

      // Log patient creation
      await auditService.logPHIModification('CREATE', 'Patient', patient.id, req.user, req, null, patient);

      res.status(201).json(successResponse({ patient }, 'Patient created successfully'));

    } catch (error) {
      next(error);
    }
  }
  // ... other methods with similar audit logging
};

module.exports = { patientController };