// // src/controllers/prescriptionController.js
// const prisma = require('../config/database');
// const { successResponse, errorResponse } = require('../utils/utils');

// const prescriptionController = {
  
//   getAllPrescriptions: async (req, res, next) => {
//     try {
//       const {
//         page = 1,
//         limit = 10,
//         patientId,
//         providerId, // ✅ Changed from doctorId to providerId
//         status,
//         sortBy = 'createdAt',
//         sortOrder = 'desc'
//       } = req.query;

//       const skip = (page - 1) * limit;

//       const where = {};
//       if (patientId) where.patientId = patientId;
//       if (providerId) where.providerId = providerId; // ✅ Changed from doctorId to providerId
//       if (status) where.status = status;

//       const [prescriptions, total] = await Promise.all([
//         prisma.prescription.findMany({
//           where,
//           include: {
//             patient: {
//               select: {
//                 id: true,
//                 mrn: true, // ✅ Changed from patientId to mrn
//                 firstName: true,
//                 lastName: true
//               }
//             },
//             provider: { // ✅ Changed from doctor to provider
//               include: {
//                 profile: {
//                   select: {
//                     firstName: true,
//                     lastName: true
//                     // ❌ Removed specialty (doesn't exist in UserProfile)
//                   }
//                 },
//                 staff: { // ✅ Added staff to get specialization
//                   select: {
//                     specialization: true
//                   }
//                 }
//               }
//             },
//             medicalRecord: {
//               select: {
//                 id: true,
//                 visitDate: true,
//                 diagnoses: { // ✅ Added diagnoses relation
//                   select: {
//                     description: true
//                   }
//                 }
//               }
//             }
//           },
//           orderBy: { [sortBy]: sortOrder },
//           skip: parseInt(skip),
//           take: parseInt(limit)
//         }),
//         prisma.prescription.count({ where })
//       ]);

//       res.json(successResponse({
//         prescriptions,
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

//   getPrescription: async (req, res, next) => {
//     try {
//       const { id } = req.params;

//       const prescription = await prisma.prescription.findUnique({
//         where: { id },
//         include: {
//           patient: {
//             include: {
//               emergencyContact: true
//             }
//           },
//           provider: { // ✅ Changed from doctor to provider
//             include: {
//               profile: true
//             }
//           },
//           medicalRecord: true
//         }
//       });

//       if (!prescription) {
//         return res.status(404).json(errorResponse('Prescription not found'));
//       }

//       res.json(successResponse({ prescription }));

//     } catch (error) {
//       next(error);
//     }
//   },

//   createPrescription: async (req, res, next) => {
//     try {
//       const {
//         patientId,
//         providerId, // ✅ Changed from doctorId to providerId
//         medicalRecordId,
//         medication,
//         dosage,
//         frequency,
//         duration,
//         instructions,
//         startDate,
//         endDate,
//         refills = 0
//       } = req.body;

//       // Validate required fields
//       if (!patientId || !providerId || !medication || !dosage || !frequency || !duration || !startDate) {
//         return res.status(400).json(errorResponse('Patient ID, provider ID, medication, dosage, frequency, duration, and start date are required'));
//       }

//       // Check if patient exists
//       const patient = await prisma.patient.findUnique({ where: { id: patientId } });
//       if (!patient) {
//         return res.status(404).json(errorResponse('Patient not found'));
//       }

//       // Check if provider exists and has appropriate role
//       const provider = await prisma.user.findUnique({ 
//         where: { 
//           id: providerId
//         }
//       });
//       if (!provider) {
//         return res.status(404).json(errorResponse('Provider not found'));
//       }

//       // Check if provider is a doctor or has prescribing privileges
//       const allowedRoles = ['DOCTOR', 'NURSE_PRACTITIONER', 'PHYSICIAN_ASSISTANT'];
//       if (!allowedRoles.includes(provider.role)) {
//         return res.status(403).json(errorResponse('This user does not have prescribing privileges'));
//       }

//       // If medicalRecordId is provided, verify it exists
//       if (medicalRecordId) {
//         const medicalRecord = await prisma.medicalRecord.findUnique({
//           where: { id: medicalRecordId }
//         });
//         if (!medicalRecord) {
//           return res.status(404).json(errorResponse('Medical record not found'));
//         }
//       }

//       const prescription = await prisma.prescription.create({
//         data: {
//           patientId,
//           providerId, // ✅ Changed from doctorId to providerId
//           medicalRecordId,
//           medication,
//           dosage,
//           frequency,
//           duration,
//           instructions,
//           startDate: new Date(startDate),
//           endDate: endDate ? new Date(endDate) : null,
//           refills: parseInt(refills)
//         },
//         include: {
//           patient: {
//             select: {
//               firstName: true,
//               lastName: true
//             }
//           },
//           provider: { // ✅ Changed from doctor to provider
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

//       res.status(201).json(successResponse({ prescription }, 'Prescription created successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   updatePrescription: async (req, res, next) => {
//     try {
//       const { id } = req.params;
//       const updateData = req.body;

//       const prescription = await prisma.prescription.findUnique({ where: { id } });
//       if (!prescription) {
//         return res.status(404).json(errorResponse('Prescription not found'));
//       }

//       // Convert date fields
//       if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
//       if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
//       if (updateData.refills) updateData.refills = parseInt(updateData.refills);

//       // ✅ Rename doctorId to providerId if present
//       if (updateData.doctorId) {
//         updateData.providerId = updateData.doctorId;
//         delete updateData.doctorId;
//       }

//       const updatedPrescription = await prisma.prescription.update({
//         where: { id },
//         data: updateData,
//         include: {
//           patient: {
//             select: {
//               firstName: true,
//               lastName: true
//             }
//           },
//           provider: { // ✅ Changed from doctor to provider
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

//       res.json(successResponse({ prescription: updatedPrescription }, 'Prescription updated successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   deletePrescription: async (req, res, next) => {
//     try {
//       const { id } = req.params;

//       const prescription = await prisma.prescription.findUnique({ where: { id } });
//       if (!prescription) {
//         return res.status(404).json(errorResponse('Prescription not found'));
//       }

//       await prisma.prescription.delete({ where: { id } });

//       res.json(successResponse(null, 'Prescription deleted successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   getPatientPrescriptions: async (req, res, next) => {
//     try {
//       const { patientId } = req.params;
//       const { status } = req.query;

//       const where = { patientId };
//       if (status) where.status = status;

//       const prescriptions = await prisma.prescription.findMany({
//         where,
//         include: {
//           provider: { // ✅ Changed from doctor to provider
//             include: {
//               profile: {
//                 select: {
//                   firstName: true,
//                   lastName: true
//                 }
//               },
//               staff: { // ✅ Added staff to get specialization
//                 select: {
//                   specialization: true
//                 }
//               }
//             }
//           },
//           medicalRecord: {
//             select: {
//               id: true,
//               visitDate: true,
//               diagnoses: { // ✅ Added diagnoses relation
//                 select: {
//                   description: true
//                 }
//               }
//             }
//           }
//         },
//         orderBy: { createdAt: 'desc' }
//       });

//       res.json(successResponse({ prescriptions }));

//     } catch (error) {
//       next(error);
//     }
//   },

//   updatePrescriptionStatus: async (req, res, next) => {
//     try {
//       const { id } = req.params;
//       const { status } = req.body;

//       if (!status) {
//         return res.status(400).json(errorResponse('Status is required'));
//       }

//       const prescription = await prisma.prescription.findUnique({ where: { id } });
//       if (!prescription) {
//         return res.status(404).json(errorResponse('Prescription not found'));
//       }

//       const updatedPrescription = await prisma.prescription.update({
//         where: { id },
//         data: { status },
//         include: {
//           patient: {
//             select: {
//               firstName: true,
//               lastName: true
//             }
//           }
//         }
//       });

//       res.json(successResponse({ prescription: updatedPrescription }, 'Prescription status updated successfully'));

//     } catch (error) {
//       next(error);
//     }
//   }
// };

// module.exports = { prescriptionController };



// src/controllers/prescriptionController.js
const prisma = require('../config/database');
const auditService = require('../services/auditService');
const { successResponse, errorResponse } = require('../utils/utils');

const prescriptionController = {
  
  getAllPrescriptions: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        patientId,
        providerId,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;

      const where = {};
      if (patientId) where.patientId = patientId;
      if (providerId) where.providerId = providerId;
      if (status) where.status = status;

      const [prescriptions, total] = await Promise.all([
        prisma.prescription.findMany({
          where,
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
                },
                staff: {
                  select: {
                    specialization: true
                  }
                }
              }
            },
            medicalRecord: {
              select: {
                id: true,
                visitDate: true,
                diagnoses: {
                  select: {
                    description: true
                  }
                }
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: parseInt(skip),
          take: parseInt(limit)
        }),
        prisma.prescription.count({ where })
      ]);

      // ✅ AUDIT: Log prescription list access
      await auditService.log('VIEW_LIST', 'Prescription', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Accessed prescriptions list - ${prescriptions.length} records, filters: ${JSON.stringify({ patientId, providerId, status })}`
      });

      res.json(successResponse({
        prescriptions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }));

    } catch (error) {
      // ✅ AUDIT: Log prescription list access error
      await auditService.log('VIEW_LIST_ERROR', 'Prescription', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Prescription list access error: ${error.message}`
      });
      next(error);
    }
  },

  getPrescription: async (req, res, next) => {
    try {
      const { id } = req.params;

      const prescription = await prisma.prescription.findUnique({
        where: { id },
        include: {
          patient: {
            include: {
              emergencyContact: true
            }
          },
          provider: {
            include: {
              profile: true
            }
          },
          medicalRecord: true
        }
      });

      if (!prescription) {
        // ✅ AUDIT: Log attempt to access non-existent prescription
        await auditService.log('VIEW_NOT_FOUND', 'Prescription', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Attempted to access non-existent prescription: ${id}`
        });
        
        return res.status(404).json(errorResponse('Prescription not found'));
      }

      // ✅ AUDIT: Log prescription access
      await auditService.logPHIAccess('Prescription', id, req.user, req);

      res.json(successResponse({ prescription }));

    } catch (error) {
      // ✅ AUDIT: Log prescription access error
      await auditService.log('VIEW_ERROR', 'Prescription', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Prescription access error: ${error.message}`
      });
      next(error);
    }
  },

  createPrescription: async (req, res, next) => {
    try {
      const {
        patientId,
        providerId,
        medicalRecordId,
        medication,
        dosage,
        frequency,
        duration,
        instructions,
        startDate,
        endDate,
        refills = 0
      } = req.body;

      // Validate required fields
      if (!patientId || !providerId || !medication || !dosage || !frequency || !duration || !startDate) {
        // ✅ AUDIT: Log validation failure
        await auditService.log('CREATE_VALIDATION_FAILED', 'Prescription', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Prescription creation validation failed - missing required fields`
        });
        
        return res.status(400).json(errorResponse('Patient ID, provider ID, medication, dosage, frequency, duration, and start date are required'));
      }

      // Check if patient exists
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        // ✅ AUDIT: Log failed prescription creation - patient not found
        await auditService.log('CREATE_FAILED', 'Prescription', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Prescription creation failed - patient not found: ${patientId}`
        });
        
        return res.status(404).json(errorResponse('Patient not found'));
      }

      // Check if provider exists and has appropriate role
      const provider = await prisma.user.findUnique({ 
        where: { 
          id: providerId
        }
      });
      if (!provider) {
        // ✅ AUDIT: Log failed prescription creation - provider not found
        await auditService.log('CREATE_FAILED', 'Prescription', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Prescription creation failed - provider not found: ${providerId}`
        });
        
        return res.status(404).json(errorResponse('Provider not found'));
      }

      // Check if provider is a doctor or has prescribing privileges
      const allowedRoles = ['DOCTOR', 'NURSE_PRACTITIONER', 'PHYSICIAN_ASSISTANT'];
      if (!allowedRoles.includes(provider.role)) {
        // ✅ AUDIT: Log unauthorized prescription creation attempt
        await auditService.log('CREATE_UNAUTHORIZED', 'Prescription', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Prescription creation failed - provider role not allowed: ${provider.role}`
        });
        
        return res.status(403).json(errorResponse('This user does not have prescribing privileges'));
      }

      // If medicalRecordId is provided, verify it exists
      if (medicalRecordId) {
        const medicalRecord = await prisma.medicalRecord.findUnique({
          where: { id: medicalRecordId }
        });
        if (!medicalRecord) {
          // ✅ AUDIT: Log failed prescription creation - medical record not found
          await auditService.log('CREATE_FAILED', 'Prescription', {
            userId: req.user.id,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            description: `Prescription creation failed - medical record not found: ${medicalRecordId}`
          });
          
          return res.status(404).json(errorResponse('Medical record not found'));
        }
      }

      const prescription = await prisma.prescription.create({
        data: {
          patientId,
          providerId,
          medicalRecordId,
          medication,
          dosage,
          frequency,
          duration,
          instructions,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          refills: parseInt(refills)
        },
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

      // ✅ AUDIT: Log prescription creation
      await auditService.logPHICreation('Prescription', prescription.id, req.user, req, prescription);

      res.status(201).json(successResponse({ prescription }, 'Prescription created successfully'));

    } catch (error) {
      // ✅ AUDIT: Log prescription creation error
      await auditService.log('CREATE_ERROR', 'Prescription', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Prescription creation error: ${error.message}`
      });
      next(error);
    }
  },

  updatePrescription: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Get old prescription data for audit
      const oldPrescription = await prisma.prescription.findUnique({ 
        where: { id },
        include: {
          patient: true,
          provider: true
        }
      });

      if (!oldPrescription) {
        // ✅ AUDIT: Log attempt to update non-existent prescription
        await auditService.log('UPDATE_NOT_FOUND', 'Prescription', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Attempted to update non-existent prescription: ${id}`
        });
        
        return res.status(404).json(errorResponse('Prescription not found'));
      }

      // Convert date fields
      if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
      if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
      if (updateData.refills) updateData.refills = parseInt(updateData.refills);

      // Rename doctorId to providerId if present
      if (updateData.doctorId) {
        updateData.providerId = updateData.doctorId;
        delete updateData.doctorId;
      }

      const updatedPrescription = await prisma.prescription.update({
        where: { id },
        data: updateData,
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

      // ✅ AUDIT: Log prescription update with before/after data
      await auditService.logPHIUpdate('Prescription', id, req.user, req, oldPrescription, updatedPrescription);

      res.json(successResponse({ prescription: updatedPrescription }, 'Prescription updated successfully'));

    } catch (error) {
      // ✅ AUDIT: Log prescription update error
      await auditService.log('UPDATE_ERROR', 'Prescription', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Prescription update error: ${error.message}`
      });
      next(error);
    }
  },

  deletePrescription: async (req, res, next) => {
    try {
      const { id } = req.params;

      // Get prescription data before deletion for audit
      const prescription = await prisma.prescription.findUnique({ 
        where: { id },
        include: {
          patient: true,
          provider: true
        }
      });

      if (!prescription) {
        // ✅ AUDIT: Log attempt to delete non-existent prescription
        await auditService.log('DELETE_NOT_FOUND', 'Prescription', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Attempted to delete non-existent prescription: ${id}`
        });
        
        return res.status(404).json(errorResponse('Prescription not found'));
      }

      await prisma.prescription.delete({ where: { id } });

      // ✅ AUDIT: Log prescription deletion
      await auditService.logPHIDeletion('Prescription', id, req.user, req, prescription);

      res.json(successResponse(null, 'Prescription deleted successfully'));

    } catch (error) {
      // ✅ AUDIT: Log prescription deletion error
      await auditService.log('DELETE_ERROR', 'Prescription', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Prescription deletion error: ${error.message}`
      });
      next(error);
    }
  },

  getPatientPrescriptions: async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const { status } = req.query;

      // Verify patient exists
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        // ✅ AUDIT: Log attempt to access prescriptions for non-existent patient
        await auditService.log('VIEW_PATIENT_NOT_FOUND', 'Prescription', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Attempted to access prescriptions for non-existent patient: ${patientId}`
        });
        
        return res.status(404).json(errorResponse('Patient not found'));
      }

      const where = { patientId };
      if (status) where.status = status;

      const prescriptions = await prisma.prescription.findMany({
        where,
        include: {
          provider: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              },
              staff: {
                select: {
                  specialization: true
                }
              }
            }
          },
          medicalRecord: {
            select: {
              id: true,
              visitDate: true,
              diagnoses: {
                select: {
                  description: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // ✅ AUDIT: Log patient prescriptions access
      await auditService.log('VIEW_PATIENT', 'Prescription', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Accessed prescriptions for patient: ${patientId} (${prescriptions.length} records)`
      });

      res.json(successResponse({ prescriptions }));

    } catch (error) {
      // ✅ AUDIT: Log patient prescriptions access error
      await auditService.log('VIEW_PATIENT_ERROR', 'Prescription', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Patient prescriptions access error: ${error.message}`
      });
      next(error);
    }
  },

  updatePrescriptionStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        // ✅ AUDIT: Log status update validation failure
        await auditService.log('UPDATE_STATUS_VALIDATION_FAILED', 'Prescription', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Prescription status update validation failed - status required`
        });
        
        return res.status(400).json(errorResponse('Status is required'));
      }

      const prescription = await prisma.prescription.findUnique({ 
        where: { id },
        include: {
          patient: true
        }
      });

      if (!prescription) {
        // ✅ AUDIT: Log attempt to update status of non-existent prescription
        await auditService.log('UPDATE_STATUS_NOT_FOUND', 'Prescription', {
          userId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          description: `Attempted to update status of non-existent prescription: ${id}`
        });
        
        return res.status(404).json(errorResponse('Prescription not found'));
      }

      const updatedPrescription = await prisma.prescription.update({
        where: { id },
        data: { status },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // ✅ AUDIT: Log prescription status update
      await auditService.log('UPDATE_STATUS', 'Prescription', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Updated prescription status from ${prescription.status} to ${status}`,
        oldValues: { status: prescription.status },
        newValues: { status: status }
      });

      res.json(successResponse({ prescription: updatedPrescription }, 'Prescription status updated successfully'));

    } catch (error) {
      // ✅ AUDIT: Log prescription status update error
      await auditService.log('UPDATE_STATUS_ERROR', 'Prescription', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        description: `Prescription status update error: ${error.message}`
      });
      next(error);
    }
  }
};

module.exports = { prescriptionController };