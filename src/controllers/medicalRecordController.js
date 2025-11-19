// // src/controllers/medicalRecordsController.js
// const prisma = require('../config/database');
// const { successResponse, errorResponse } = require('../utils/utils');
// const { medicalRecordValidation } = require('../utils/validation');

// const medicalRecordsController = {
//   createMedicalRecord: async (req, res) => {
//     try {
//       const { error, value } = medicalRecordValidation.create.validate(req.body);
//       if (error) {
//         return res.status(400).json(errorResponse(
//           'Validation failed',
//           400,
//           error.details.map(detail => detail.message)
//         ));
//       }

//       const {
//         patientId,
//         chiefComplaint,
//         historyOfPresentIllness,
//         pastMedicalHistory,
//         medications,
//         allergies,
//         socialHistory,
//         familyHistory,
//         examination,
//         assessment,
//         plan,
//         height,
//         weight,
//         temperature,
//         bloodPressure,
//         heartRate,
//         respiratoryRate,
//         oxygenSaturation,
//         followUpDate
//       } = value;

//       // Verify patient exists
//       const patient = await prisma.patient.findUnique({
//         where: { id: patientId }
//       });

//       if (!patient) {
//         return res.status(404).json(errorResponse('Patient not found.', 404));
//       }

//       const medicalRecord = await prisma.medicalRecord.create({
//         data: {
//           patientId,
//           providerId: req.user.id,
//           chiefComplaint,
//           historyOfPresentIllness,
//           pastMedicalHistory,
//           medications,
//           allergies,
//           socialHistory,
//           familyHistory,
//           examination,
//           assessment,
//           plan,
//           height,
//           weight,
//           temperature,
//           bloodPressure,
//           heartRate,
//           respiratoryRate,
//           oxygenSaturation,
//           followUpDate: followUpDate ? new Date(followUpDate) : null
//         },
//         include: {
//           patient: true,
//           provider: {
//             include: {
//               profile: true
//             }
//           },
//           prescriptions: true,
//           labResults: true,
//           diagnoses: true
//         }
//       });

//       // Log creation
//       await prisma.accessLog.create({
//         data: {
//           userId: req.user.id,
//           action: 'CREATE',
//           resource: 'MEDICAL_RECORD',
//           resourceId: medicalRecord.id,
//           ipAddress: req.ip,
//           userAgent: req.get('User-Agent')
//         }
//       });

//       res.status(201).json(successResponse(
//         { medicalRecord },
//         'Medical record created successfully',
//         201
//       ));

//     } catch (error) {
//       console.error('Create medical record error:', error);
//       res.status(500).json(errorResponse('Failed to create medical record.'));
//     }
//   },

//   getPatientMedicalRecords: async (req, res) => {
//     try {
//       const { patientId } = req.params;
//       const { page = 1, limit = 10 } = req.query;
      
//       const skip = (parseInt(page) - 1) * parseInt(limit);
//       const take = parseInt(limit);

//       const medicalRecords = await prisma.medicalRecord.findMany({
//         where: { patientId },
//         skip,
//         take,
//         include: {
//           provider: {
//             include: {
//               profile: true
//             }
//           },
//           prescriptions: true,
//           labResults: true,
//           diagnoses: true
//         },
//         orderBy: { visitDate: 'desc' }
//       });

//       const total = await prisma.medicalRecord.count({ where: { patientId } });

//       res.json(successResponse({
//         medicalRecords,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       }));

//     } catch (error) {
//       console.error('Get medical records error:', error);
//       res.status(500).json(errorResponse('Failed to retrieve medical records.'));
//     }
//   }
// };

// module.exports = medicalRecordsController;



// src/controllers/medicalRecordsController.js - HIPAA COMPLIANT VERSION
// const prisma = require('../config/database');
// const auditService = require('../services/auditService');
// const { successResponse, errorResponse } = require('../utils/utils');
// const { medicalRecordValidation } = require('../utils/validation');

// const medicalRecordsController = {
//   createMedicalRecord: async (req, res) => {
//     try {
//       const { error, value } = medicalRecordValidation.create.validate(req.body);
//       if (error) {
//         // ✅ HIPAA COMPLIANT: Generic validation error
//         await auditService.log('CREATE_VALIDATION_FAILED', 'MedicalRecord', {
//           userId: req.user.id,
//           ipAddress: req.ip,
//           userAgent: req.get('User-Agent'),
//           description: 'Medical record creation validation failed'
//         });
        
//         return res.status(400).json(errorResponse(
//           'Validation failed',
//           400,
//           error.details.map(detail => detail.message)
//         ));
//       }

//       const { patientId, chiefComplaint, /* ... other fields */ } = value;

//       // Verify patient exists
//       const patient = await prisma.patient.findUnique({
//         where: { id: patientId }
//       });

//       if (!patient) {
//         // ✅ HIPAA COMPLIANT: Generic patient not found
//         await auditService.log('CREATE_FAILED', 'MedicalRecord', {
//           userId: req.user.id,
//           ipAddress: req.ip,
//           userAgent: req.get('User-Agent'),
//           description: 'Medical record creation failed - patient not found'
//         });
        
//         return res.status(404).json(errorResponse('Patient not found.', 404));
//       }

//       const medicalRecord = await prisma.medicalRecord.create({
//         data: {
//           patientId,
//           providerId: req.user.id,
//           chiefComplaint,
//           // ... other fields
//         },
//         include: {
//           patient: {
//             select: {
//               id: true,
//               mrn: true,
//               firstName: true,
//               lastName: true
//             }
//           },
//           provider: {
//             include: {
//               profile: {
//                 select: {
//                   firstName: true,
//                   lastName: true
//                 }
//               }
//             }
//           }
//         }
//       });

//       // ✅ HIPAA COMPLIANT: Minimal PHI in audit log
//       await auditService.logPHICreation('MedicalRecord', medicalRecord.id, req.user, req, {
//         recordType: 'MedicalRecord',
//         hasChiefComplaint: !!chiefComplaint,
//         // ❌ NO clinical data, NO patient identifiers beyond ID
//       });

//       // Keep existing AccessLog
//       await prisma.accessLog.create({
//         data: {
//           userId: req.user.id,
//           action: 'CREATE',
//           resource: 'MEDICAL_RECORD',
//           resourceId: medicalRecord.id,
//           ipAddress: req.ip,
//           userAgent: req.get('User-Agent')
//         }
//       });

//       res.status(201).json(successResponse(
//         { medicalRecord },
//         'Medical record created successfully',
//         201
//       ));

//     } catch (error) {
//       console.error('Create medical record error:', error);
      
//       // ✅ HIPAA COMPLIANT: Generic error description
//       await auditService.log('CREATE_ERROR', 'MedicalRecord', {
//         userId: req.user.id,
//         ipAddress: req.ip,
//         userAgent: req.get('User-Agent'),
//         description: 'Medical record creation system error'
//       });
      
//       res.status(500).json(errorResponse('Failed to create medical record.'));
//     }
//   },

//   getPatientMedicalRecords: async (req, res) => {
//     try {
//       const { patientId } = req.params;
//       const { page = 1, limit = 10 } = req.query;
      
//       const skip = (parseInt(page) - 1) * parseInt(limit);
//       const take = parseInt(limit);

//       // Verify patient exists
//       const patient = await prisma.patient.findUnique({
//         where: { id: patientId }
//       });

//       if (!patient) {
//         // ✅ HIPAA COMPLIANT: Generic patient not found
//         await auditService.log('VIEW_PATIENT_NOT_FOUND', 'MedicalRecord', {
//           userId: req.user.id,
//           ipAddress: req.ip,
//           userAgent: req.get('User-Agent'),
//           description: 'Attempted to access medical records for non-existent patient'
//         });
        
//         return res.status(404).json(errorResponse('Patient not found.'));
//       }

//       const medicalRecords = await prisma.medicalRecord.findMany({
//         where: { patientId },
//         skip,
//         take,
//         include: {
//           provider: {
//             include: {
//               profile: {
//                 select: {
//                   firstName: true,
//                   lastName: true
//                 }
//               }
//             }
//           }
//           // ❌ Limit included data to avoid exposing sensitive information
//         },
//         orderBy: { visitDate: 'desc' }
//       });

//       const total = await prisma.medicalRecord.count({ where: { patientId } });

//       // ✅ HIPAA COMPLIANT: Log access without clinical details
//       await auditService.logPHIAccess('MedicalRecord', patientId, req.user, req);

//       res.json(successResponse({
//         medicalRecords,
//         pagination: {
//           page: parseInt(page),
//           limit: parseInt(limit),
//           total,
//           pages: Math.ceil(total / limit)
//         }
//       }));

//     } catch (error) {
//       console.error('Get medical records error:', error);
      
//       // ✅ HIPAA COMPLIANT: Generic error
//       await auditService.log('VIEW_ERROR', 'MedicalRecord', {
//         userId: req.user.id,
//         ipAddress: req.ip,
//         userAgent: req.get('User-Agent'),
//         description: 'Medical records access system error'
//       });
      
//       res.status(500).json(errorResponse('Failed to retrieve medical records.'));
//     }
//   },

//   getMedicalRecord: async (req, res) => {
//     try {
//       const { id } = req.params;

//       const medicalRecord = await prisma.medicalRecord.findUnique({
//         where: { id },
//         include: {
//           patient: {
//             select: {
//               id: true,
//               mrn: true,
//               firstName: true,
//               lastName: true
//               // ❌ Don't include sensitive patient data like emergency contact, insurance
//             }
//           },
//           provider: {
//             include: {
//               profile: {
//                 select: {
//                   firstName: true,
//                   lastName: true
//                 }
//               }
//             }
//           }
//           // ❌ Be selective about including prescriptions, lab results, diagnoses
//         }
//       });

//       if (!medicalRecord) {
//         // ✅ HIPAA COMPLIANT: Generic not found
//         await auditService.log('VIEW_NOT_FOUND', 'MedicalRecord', {
//           userId: req.user.id,
//           ipAddress: req.ip,
//           userAgent: req.get('User-Agent'),
//           description: 'Attempted to access non-existent medical record'
//         });
        
//         return res.status(404).json(errorResponse('Medical record not found.'));
//       }

//       // ✅ HIPAA COMPLIANT: Log access without clinical details
//       await auditService.logPHIAccess('MedicalRecord', id, req.user, req);

//       res.json(successResponse({ medicalRecord }));

//     } catch (error) {
//       console.error('Get medical record error:', error);
      
//       // ✅ HIPAA COMPLIANT: Generic error
//       await auditService.log('VIEW_ERROR', 'MedicalRecord', {
//         userId: req.user.id,
//         ipAddress: req.ip,
//         userAgent: req.get('User-Agent'),
//         description: 'Medical record access system error'
//       });
      
//       res.status(500).json(errorResponse('Failed to retrieve medical record.'));
//     }
//   },

//   updateMedicalRecord: async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { error, value } = medicalRecordValidation.update.validate(req.body);
      
//       if (error) {
//         await auditService.log('UPDATE_VALIDATION_FAILED', 'MedicalRecord', {
//           userId: req.user.id,
//           ipAddress: req.ip,
//           userAgent: req.get('User-Agent'),
//           description: 'Medical record update validation failed'
//         });
        
//         return res.status(400).json(errorResponse(
//           'Validation failed',
//           400,
//           error.details.map(detail => detail.message)
//         ));
//       }

//       const oldMedicalRecord = await prisma.medicalRecord.findUnique({
//         where: { id }
//       });

//       if (!oldMedicalRecord) {
//         await auditService.log('UPDATE_NOT_FOUND', 'MedicalRecord', {
//           userId: req.user.id,
//           ipAddress: req.ip,
//           userAgent: req.get('User-Agent'),
//           description: 'Attempted to update non-existent medical record'
//         });
        
//         return res.status(404).json(errorResponse('Medical record not found.'));
//       }

//       if (value.followUpDate) {
//         value.followUpDate = new Date(value.followUpDate);
//       }

//       const medicalRecord = await prisma.medicalRecord.update({
//         where: { id },
//         data: value,
//         include: {
//           patient: {
//             select: {
//               firstName: true,
//               lastName: true
//             }
//           }
//         }
//       });

//       // ✅ HIPAA COMPLIANT: Track update without storing clinical data
//       await auditService.logPHIUpdate('MedicalRecord', id, req.user, req, {
//         updatedFields: Object.keys(value)
//         // ❌ Don't store actual clinical values in audit log
//       });

//       res.json(successResponse({ medicalRecord }, 'Medical record updated successfully'));

//     } catch (error) {
//       console.error('Update medical record error:', error);
      
//       await auditService.log('UPDATE_ERROR', 'MedicalRecord', {
//         userId: req.user.id,
//         ipAddress: req.ip,
//         userAgent: req.get('User-Agent'),
//         description: 'Medical record update system error'
//       });
      
//       res.status(500).json(errorResponse('Failed to update medical record.'));
//     }
//   }
// };

// module.exports = medicalRecordsController;





// src/controllers/medicalRecordsController.js
const prisma = require('../config/database');
const auditService = require('../services/auditService');
const { successResponse, errorResponse } = require('../utils/utils');
const { medicalRecordValidation } = require('../utils/validation');

const medicalRecordsController = {
  createMedicalRecord: async (req, res) => {
    try {
      const { error, value } = medicalRecordValidation.create.validate(req.body);
      if (error) {
        // ✅ AUDIT: Log validation failure
        await auditService.log('CREATE_VALIDATION_FAILED', 'MedicalRecord', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Medical record creation validation failed: ${error.details.map(detail => detail.message).join(', ')}`
        });
        
        return res.status(400).json(errorResponse(
          'Validation failed',
          400,
          error.details.map(detail => detail.message)
        ));
      }

      const {
        patientId,
        chiefComplaint,
        historyOfPresentIllness,
        pastMedicalHistory,
        medications,
        allergies,
        socialHistory,
        familyHistory,
        examination,
        assessment,
        plan,
        height,
        weight,
        temperature,
        bloodPressure,
        heartRate,
        respiratoryRate,
        oxygenSaturation,
        followUpDate
      } = value;

      // Verify patient exists
      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      });

      if (!patient) {
        // ✅ AUDIT: Log failed medical record creation - patient not found
        await auditService.log('CREATE_FAILED', 'MedicalRecord', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Medical record creation failed - patient not found: ${patientId}`
        });
        
        return res.status(404).json(errorResponse('Patient not found.', 404));
      }

      const medicalRecord = await prisma.medicalRecord.create({
        data: {
          patientId,
          providerId: req.user.id,
          chiefComplaint,
          historyOfPresentIllness,
          pastMedicalHistory,
          medications,
          allergies,
          socialHistory,
          familyHistory,
          examination,
          assessment,
          plan,
          height,
          weight,
          temperature,
          bloodPressure,
          heartRate,
          respiratoryRate,
          oxygenSaturation,
          followUpDate: followUpDate ? new Date(followUpDate) : null
        },
        include: {
          patient: true,
          provider: {
            include: {
              profile: true
            }
          },
          prescriptions: true,
          labResults: true,
          diagnoses: true
        }
      });

      // ✅ AUDIT: Log medical record creation (HIGH SENSITIVITY - PHI)
      await auditService.logPHICreation('MedicalRecord', medicalRecord.id, req.user, req, {
        patientId: medicalRecord.patientId,
        providerId: medicalRecord.providerId,
        chiefComplaint: medicalRecord.chiefComplaint,
        visitDate: medicalRecord.visitDate
      });

      // Keep existing AccessLog for backward compatibility
      await prisma.accessLog.create({
        data: {
          userId: req.user.id,
          action: 'CREATE',
          resource: 'MEDICAL_RECORD',
          resourceId: medicalRecord.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.status(201).json(successResponse(
        { medicalRecord },
        'Medical record created successfully',
        201
      ));

    } catch (error) {
      console.error('Create medical record error:', error);
      
      // ✅ AUDIT: Log medical record creation error
      await auditService.log('CREATE_ERROR', 'MedicalRecord', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Medical record creation error: ${error.message}`
      });
      
      res.status(500).json(errorResponse('Failed to create medical record.'));
    }
  },

  getPatientMedicalRecords: async (req, res) => {
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      // Verify patient exists
      const patient = await prisma.patient.findUnique({
        where: { id: patientId }
      });

      if (!patient) {
        // ✅ AUDIT: Log attempt to access medical records for non-existent patient
        await auditService.log('VIEW_PATIENT_NOT_FOUND', 'MedicalRecord', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Attempted to access medical records for non-existent patient: ${patientId}`
        });
        
        return res.status(404).json(errorResponse('Patient not found.'));
      }

      const medicalRecords = await prisma.medicalRecord.findMany({
        where: { patientId },
        skip,
        take,
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
      });

      const total = await prisma.medicalRecord.count({ where: { patientId } });

      // ✅ AUDIT: Log patient medical records access (HIGH SENSITIVITY - PHI)
      await auditService.logPHIAccess('MedicalRecord', patientId, req.user, req);

      // Keep existing AccessLog for backward compatibility
      await prisma.accessLog.create({
        data: {
          userId: req.user.id,
          action: 'VIEW',
          resource: 'MEDICAL_RECORD',
          resourceId: patientId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Accessed ${medicalRecords.length} medical records for patient`
        }
      });

      res.json(successResponse({
        medicalRecords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }));

    } catch (error) {
      console.error('Get medical records error:', error);
      
      // ✅ AUDIT: Log medical records access error
      await auditService.log('VIEW_ERROR', 'MedicalRecord', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Medical records access error: ${error.message}`
      });
      
      res.status(500).json(errorResponse('Failed to retrieve medical records.'));
    }
  },

  // ✅ ADDED: Get specific medical record
  getMedicalRecord: async (req, res) => {
    try {
      const { id } = req.params;

      const medicalRecord = await prisma.medicalRecord.findUnique({
        where: { id },
        include: {
          patient: {
            include: {
              emergencyContact: true,
              insurance: true
            }
          },
          provider: {
            include: {
              profile: true
            }
          },
          prescriptions: true,
          labResults: true,
          diagnoses: true,
          appointment: true
        }
      });

      if (!medicalRecord) {
        // ✅ AUDIT: Log attempt to access non-existent medical record
        await auditService.log('VIEW_NOT_FOUND', 'MedicalRecord', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Attempted to access non-existent medical record: ${id}`
        });
        
        return res.status(404).json(errorResponse('Medical record not found.'));
      }

      // ✅ AUDIT: Log medical record access (HIGH SENSITIVITY - PHI)
      await auditService.logPHIAccess('MedicalRecord', id, req.user, req);

      // Keep existing AccessLog for backward compatibility
      await prisma.accessLog.create({
        data: {
          userId: req.user.id,
          action: 'VIEW',
          resource: 'MEDICAL_RECORD',
          resourceId: medicalRecord.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.json(successResponse({ medicalRecord }));

    } catch (error) {
      console.error('Get medical record error:', error);
      
      // ✅ AUDIT: Log medical record access error
      await auditService.log('VIEW_ERROR', 'MedicalRecord', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Medical record access error: ${error.message}`
      });
      
      res.status(500).json(errorResponse('Failed to retrieve medical record.'));
    }
  },

  // ✅ ADDED: Update medical record
  updateMedicalRecord: async (req, res) => {
    try {
      const { id } = req.params;
      const { error, value } = medicalRecordValidation.update.validate(req.body);
      
      if (error) {
        // ✅ AUDIT: Log validation failure
        await auditService.log('UPDATE_VALIDATION_FAILED', 'MedicalRecord', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Medical record update validation failed: ${error.details.map(detail => detail.message).join(', ')}`
        });
        
        return res.status(400).json(errorResponse(
          'Validation failed',
          400,
          error.details.map(detail => detail.message)
        ));
      }

      // Get old medical record data for audit
      const oldMedicalRecord = await prisma.medicalRecord.findUnique({
        where: { id },
        include: {
          patient: true,
          provider: true
        }
      });

      if (!oldMedicalRecord) {
        // ✅ AUDIT: Log attempt to update non-existent medical record
        await auditService.log('UPDATE_NOT_FOUND', 'MedicalRecord', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Attempted to update non-existent medical record: ${id}`
        });
        
        return res.status(404).json(errorResponse('Medical record not found.'));
      }

      // Convert date field if present
      if (value.followUpDate) {
        value.followUpDate = new Date(value.followUpDate);
      }

      const medicalRecord = await prisma.medicalRecord.update({
        where: { id },
        data: value,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          provider: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      // ✅ AUDIT: Log medical record update (HIGH SENSITIVITY - PHI)
      await auditService.logPHIUpdate('MedicalRecord', id, req.user, req, oldMedicalRecord, medicalRecord);

      // Keep existing AccessLog for backward compatibility
      await prisma.accessLog.create({
        data: {
          userId: req.user.id,
          action: 'UPDATE',
          resource: 'MEDICAL_RECORD',
          resourceId: medicalRecord.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.json(successResponse({ medicalRecord }, 'Medical record updated successfully'));

    } catch (error) {
      console.error('Update medical record error:', error);
      
      // ✅ AUDIT: Log medical record update error
      await auditService.log('UPDATE_ERROR', 'MedicalRecord', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Medical record update error: ${error.message}`
      });
      
      res.status(500).json(errorResponse('Failed to update medical record.'));
    }
  },

  // ✅ ADDED: Delete medical record
  deleteMedicalRecord: async (req, res) => {
    try {
      const { id } = req.params;

      // Get medical record data before deletion for audit
      const medicalRecord = await prisma.medicalRecord.findUnique({
        where: { id },
        include: {
          patient: true,
          provider: true,
          prescriptions: true,
          labResults: true,
          diagnoses: true
        }
      });

      if (!medicalRecord) {
        // ✅ AUDIT: Log attempt to delete non-existent medical record
        await auditService.log('DELETE_NOT_FOUND', 'MedicalRecord', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Attempted to delete non-existent medical record: ${id}`
        });
        
        return res.status(404).json(errorResponse('Medical record not found.'));
      }

      await prisma.medicalRecord.delete({
        where: { id }
      });

      // ✅ AUDIT: Log medical record deletion (HIGH SENSITIVITY - PHI)
      await auditService.logPHIDeletion('MedicalRecord', id, req.user, req, {
        patientId: medicalRecord.patientId,
        providerId: medicalRecord.providerId,
        chiefComplaint: medicalRecord.chiefComplaint,
        visitDate: medicalRecord.visitDate,
        prescriptionsCount: medicalRecord.prescriptions.length,
        labResultsCount: medicalRecord.labResults.length,
        diagnosesCount: medicalRecord.diagnoses.length
      });

      // Keep existing AccessLog for backward compatibility
      await prisma.accessLog.create({
        data: {
          userId: req.user.id,
          action: 'DELETE',
          resource: 'MEDICAL_RECORD',
          resourceId: medicalRecord.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.json(successResponse(null, 'Medical record deleted successfully'));

    } catch (error) {
      console.error('Delete medical record error:', error);
      
      // ✅ AUDIT: Log medical record deletion error
      await auditService.log('DELETE_ERROR', 'MedicalRecord', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Medical record deletion error: ${error.message}`
      });
      
      res.status(500).json(errorResponse('Failed to delete medical record.'));
    }
  },

  // ✅ ADDED: Get all medical records with filtering
  getAllMedicalRecords: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        patientId,
        providerId,
        startDate,
        endDate,
        sortBy = 'visitDate',
        sortOrder = 'desc'
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};
      if (patientId) where.patientId = patientId;
      if (providerId) where.providerId = providerId;
      
      if (startDate || endDate) {
        where.visitDate = {};
        if (startDate) where.visitDate.gte = new Date(startDate);
        if (endDate) where.visitDate.lte = new Date(endDate);
      }

      const medicalRecords = await prisma.medicalRecord.findMany({
        where,
        skip,
        take,
        include: {
          patient: {
            select: {
              id: true,
              mrn: true,
              firstName: true,
              lastName: true
            }
          },
          provider: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          prescriptions: true,
          labResults: true,
          diagnoses: true
        },
        orderBy: { [sortBy]: sortOrder }
      });

      const total = await prisma.medicalRecord.count({ where });

      // ✅ AUDIT: Log medical records list access
      await auditService.log('VIEW_LIST', 'MedicalRecord', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Accessed medical records list - ${medicalRecords.length} records, filters: ${JSON.stringify({ patientId, providerId, startDate, endDate })}`
      });

      res.json(successResponse({
        medicalRecords,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }));

    } catch (error) {
      console.error('Get all medical records error:', error);
      
      // ✅ AUDIT: Log medical records list access error
      await auditService.log('VIEW_LIST_ERROR', 'MedicalRecord', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Medical records list access error: ${error.message}`
      });
      
      res.status(500).json(errorResponse('Failed to retrieve medical records.'));
    }
  }
};

module.exports = medicalRecordsController;