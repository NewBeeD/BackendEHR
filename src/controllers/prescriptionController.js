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
//         providerId,
//         status,
//         sortBy = 'createdAt',
//         sortOrder = 'desc'
//       } = req.query;

//       const skip = (page - 1) * limit;

//       const where = {};
//       if (patientId) where.patientId = patientId;
//       if (doctorId) where.doctorId = providerId;
//       if (status) where.status = status;

//       const [prescriptions, total] = await Promise.all([
//         prisma.prescription.findMany({
//           where,
//           include: {
//             patient: {
//               select: {
//                 id: true,
//                 mrn: true,
//                 firstName: true,
//                 lastName: true
//               }
//             },
//             provider: {
//               include: {
//                 profile: {
//                   select: {
//                     firstName: true,
//                     lastName: true,
//                     // specialty: true
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
//                 diagnosis: true,
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
//           provider: {
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
//         providerId,
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
//       if (!patientId || !doctorId || !medication || !dosage || !frequency || !duration || !startDate) {
//         return res.status(400).json(errorResponse('Patient ID, doctor ID, medication, dosage, frequency, duration, and start date are required'));
//       }

//       // Check if patient exists
//       const patient = await prisma.patient.findUnique({ where: { id: patientId } });
//       if (!patient) {
//         return res.status(404).json(errorResponse('Patient not found'));
//       }

//       // Check if doctor exists
//       const doctor = await prisma.user.findUnique({ 
//         where: { 
//           id: doctorId,
//           role: 'Doctor'
//         }
//       });
//       if (!doctor) {
//         return res.status(404).json(errorResponse('Doctor not found'));
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
//           doctorId,
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
//           doctor: {
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
//           doctor: {
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
//           doctor: {
//             include: {
//               profile: {
//                 select: {
//                   firstName: true,
//                   lastName: true,
//                   specialty: true
//                 }
//               }
//             }
//           },
//           medicalRecord: {
//             select: {
//               diagnosis: true,
//               visitDate: true
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
const { successResponse, errorResponse } = require('../utils/utils');

const prescriptionController = {
  
  getAllPrescriptions: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        patientId,
        providerId, // ✅ Changed from doctorId to providerId
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;

      const where = {};
      if (patientId) where.patientId = patientId;
      if (providerId) where.providerId = providerId; // ✅ Changed from doctorId to providerId
      if (status) where.status = status;

      const [prescriptions, total] = await Promise.all([
        prisma.prescription.findMany({
          where,
          include: {
            patient: {
              select: {
                id: true,
                mrn: true, // ✅ Changed from patientId to mrn
                firstName: true,
                lastName: true
              }
            },
            provider: { // ✅ Changed from doctor to provider
              include: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                    // ❌ Removed specialty (doesn't exist in UserProfile)
                  }
                },
                staff: { // ✅ Added staff to get specialization
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
                diagnoses: { // ✅ Added diagnoses relation
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
          provider: { // ✅ Changed from doctor to provider
            include: {
              profile: true
            }
          },
          medicalRecord: true
        }
      });

      if (!prescription) {
        return res.status(404).json(errorResponse('Prescription not found'));
      }

      res.json(successResponse({ prescription }));

    } catch (error) {
      next(error);
    }
  },

  createPrescription: async (req, res, next) => {
    try {
      const {
        patientId,
        providerId, // ✅ Changed from doctorId to providerId
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
        return res.status(400).json(errorResponse('Patient ID, provider ID, medication, dosage, frequency, duration, and start date are required'));
      }

      // Check if patient exists
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        return res.status(404).json(errorResponse('Patient not found'));
      }

      // Check if provider exists and has appropriate role
      const provider = await prisma.user.findUnique({ 
        where: { 
          id: providerId
        }
      });
      if (!provider) {
        return res.status(404).json(errorResponse('Provider not found'));
      }

      // Check if provider is a doctor or has prescribing privileges
      const allowedRoles = ['DOCTOR', 'NURSE_PRACTITIONER', 'PHYSICIAN_ASSISTANT'];
      if (!allowedRoles.includes(provider.role)) {
        return res.status(403).json(errorResponse('This user does not have prescribing privileges'));
      }

      // If medicalRecordId is provided, verify it exists
      if (medicalRecordId) {
        const medicalRecord = await prisma.medicalRecord.findUnique({
          where: { id: medicalRecordId }
        });
        if (!medicalRecord) {
          return res.status(404).json(errorResponse('Medical record not found'));
        }
      }

      const prescription = await prisma.prescription.create({
        data: {
          patientId,
          providerId, // ✅ Changed from doctorId to providerId
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
          provider: { // ✅ Changed from doctor to provider
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

      res.status(201).json(successResponse({ prescription }, 'Prescription created successfully'));

    } catch (error) {
      next(error);
    }
  },

  updatePrescription: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const prescription = await prisma.prescription.findUnique({ where: { id } });
      if (!prescription) {
        return res.status(404).json(errorResponse('Prescription not found'));
      }

      // Convert date fields
      if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
      if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
      if (updateData.refills) updateData.refills = parseInt(updateData.refills);

      // ✅ Rename doctorId to providerId if present
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
          provider: { // ✅ Changed from doctor to provider
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

      res.json(successResponse({ prescription: updatedPrescription }, 'Prescription updated successfully'));

    } catch (error) {
      next(error);
    }
  },

  deletePrescription: async (req, res, next) => {
    try {
      const { id } = req.params;

      const prescription = await prisma.prescription.findUnique({ where: { id } });
      if (!prescription) {
        return res.status(404).json(errorResponse('Prescription not found'));
      }

      await prisma.prescription.delete({ where: { id } });

      res.json(successResponse(null, 'Prescription deleted successfully'));

    } catch (error) {
      next(error);
    }
  },

  getPatientPrescriptions: async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const { status } = req.query;

      const where = { patientId };
      if (status) where.status = status;

      const prescriptions = await prisma.prescription.findMany({
        where,
        include: {
          provider: { // ✅ Changed from doctor to provider
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              },
              staff: { // ✅ Added staff to get specialization
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
              diagnoses: { // ✅ Added diagnoses relation
                select: {
                  description: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(successResponse({ prescriptions }));

    } catch (error) {
      next(error);
    }
  },

  updatePrescriptionStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json(errorResponse('Status is required'));
      }

      const prescription = await prisma.prescription.findUnique({ where: { id } });
      if (!prescription) {
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

      res.json(successResponse({ prescription: updatedPrescription }, 'Prescription status updated successfully'));

    } catch (error) {
      next(error);
    }
  }
};

module.exports = { prescriptionController };