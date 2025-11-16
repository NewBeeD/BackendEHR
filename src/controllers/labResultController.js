// // src/controllers/labResultController.js
// const prisma = require('../config/database');
// const { successResponse, errorResponse } = require('../utils/utils');

// const labResultController = {
  
//   getAllLabResults: async (req, res, next) => {
//     try {
//       const {
//         page = 1,
//         limit = 10,
//         patientId,
//         doctorId,
//         testType,
//         status,
//         sortBy = 'reportedAt',
//         sortOrder = 'desc'
//       } = req.query;

//       const skip = (page - 1) * limit;

//       const where = {};
//       if (patientId) where.patientId = patientId;
//       if (doctorId) where.doctorId = doctorId;
//       if (testType) where.testType = testType;
//       if (status) where.status = status;

//       const [labResults, total] = await Promise.all([
//         prisma.labResult.findMany({
//           where,
//           include: {
//             patient: {
//               select: {
//                 id: true,
//                 patientId: true,
//                 firstName: true,
//                 lastName: true
//               }
//             },
//             doctor: {
//               include: {
//                 profile: {
//                   select: {
//                     firstName: true,
//                     lastName: true,
//                     specialty: true
//                   }
//                 }
//               }
//             }
//           },
//           orderBy: { [sortBy]: sortOrder },
//           skip: parseInt(skip),
//           take: parseInt(limit)
//         }),
//         prisma.labResult.count({ where })
//       ]);

//       res.json(successResponse({
//         labResults,
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

//   getLabResult: async (req, res, next) => {
//     try {
//       const { id } = req.params;

//       const labResult = await prisma.labResult.findUnique({
//         where: { id },
//         include: {
//           patient: {
//             include: {
//               emergencyContact: true
//             }
//           },
//           doctor: {
//             include: {
//               profile: true
//             }
//           }
//         }
//       });

//       if (!labResult) {
//         return res.status(404).json(errorResponse('Lab result not found'));
//       }

//       res.json(successResponse({ labResult }));

//     } catch (error) {
//       next(error);
//     }
//   },

//   createLabResult: async (req, res, next) => {
//     try {
//       const {
//         patientId,
//         doctorId,
//         testName,
//         testType,
//         result,
//         normalRange,
//         units,
//         notes,
//         performedAt,
//         status = 'Pending',
//         attachment
//       } = req.body;

//       // Validate required fields
//       if (!patientId || !doctorId || !testName || !testType || !result) {
//         return res.status(400).json(errorResponse('Patient ID, doctor ID, test name, test type, and result are required'));
//       }

//       // Check if patient exists
//       const patient = await prisma.patient.findUnique({ where: { id: patientId } });
//       if (!patient) {
//         return res.status(404).json(errorResponse('Patient not found'));
//       }

//       // Check if doctor exists
//       const doctor = await prisma.user.findUnique({ 
//         where: { 
//           id: doctorId 
//         }
//       });
//       if (!doctor) {
//         return res.status(404).json(errorResponse('Doctor not found'));
//       }

//       const labResult = await prisma.labResult.create({
//         data: {
//           patientId,
//           doctorId,
//           testName,
//           testType,
//           result,
//           normalRange,
//           units,
//           notes,
//           performedAt: performedAt ? new Date(performedAt) : null,
//           status,
//           attachment
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

//       res.status(201).json(successResponse({ labResult }, 'Lab result created successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   updateLabResult: async (req, res, next) => {
//     try {
//       const { id } = req.params;
//       const updateData = req.body;

//       const labResult = await prisma.labResult.findUnique({ where: { id } });
//       if (!labResult) {
//         return res.status(404).json(errorResponse('Lab result not found'));
//       }

//       // Convert date field
//       if (updateData.performedAt) updateData.performedAt = new Date(updateData.performedAt);

//       const updatedLabResult = await prisma.labResult.update({
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

//       res.json(successResponse({ labResult: updatedLabResult }, 'Lab result updated successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   deleteLabResult: async (req, res, next) => {
//     try {
//       const { id } = req.params;

//       const labResult = await prisma.labResult.findUnique({ where: { id } });
//       if (!labResult) {
//         return res.status(404).json(errorResponse('Lab result not found'));
//       }

//       await prisma.labResult.delete({ where: { id } });

//       res.json(successResponse(null, 'Lab result deleted successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   getPatientLabResults: async (req, res, next) => {
//     try {
//       const { patientId } = req.params;
//       const { testType, status } = req.query;

//       const where = { patientId };
//       if (testType) where.testType = testType;
//       if (status) where.status = status;

//       const labResults = await prisma.labResult.findMany({
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
//           }
//         },
//         orderBy: { reportedAt: 'desc' }
//       });

//       res.json(successResponse({ labResults }));

//     } catch (error) {
//       next(error);
//     }
//   },

//   updateLabResultStatus: async (req, res, next) => {
//     try {
//       const { id } = req.params;
//       const { status } = req.body;

//       if (!status) {
//         return res.status(400).json(errorResponse('Status is required'));
//       }

//       const labResult = await prisma.labResult.findUnique({ where: { id } });
//       if (!labResult) {
//         return res.status(404).json(errorResponse('Lab result not found'));
//       }

//       const updatedLabResult = await prisma.labResult.update({
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

//       res.json(successResponse({ labResult: updatedLabResult }, 'Lab result status updated successfully'));

//     } catch (error) {
//       next(error);
//     }
//   }
// };

// module.exports = { labResultController };



// src/controllers/labResultController.js
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/utils');

const labResultController = {
  
  getAllLabResults: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        patientId,
        providerId, // ✅ Changed from doctorId to providerId
        testType,
        status,
        sortBy = 'reportedAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;

      const where = {};
      if (patientId) where.patientId = patientId;
      if (providerId) where.providerId = providerId; // ✅ Changed from doctorId to providerId
      if (testType) where.testType = testType;
      if (status) where.status = status;

      const [labResults, total] = await Promise.all([
        prisma.labResult.findMany({
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
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: parseInt(skip),
          take: parseInt(limit)
        }),
        prisma.labResult.count({ where })
      ]);

      res.json(successResponse({
        labResults,
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

  getLabResult: async (req, res, next) => {
    try {
      const { id } = req.params;

      const labResult = await prisma.labResult.findUnique({
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
          }
        }
      });

      if (!labResult) {
        return res.status(404).json(errorResponse('Lab result not found'));
      }

      res.json(successResponse({ labResult }));

    } catch (error) {
      next(error);
    }
  },

  createLabResult: async (req, res, next) => {
    try {
      const {
        patientId,
        providerId, // ✅ Changed from doctorId to providerId
        testName,
        testType,
        result,
        normalRange,
        units,
        notes,
        performedAt,
        status = 'PENDING', // ✅ Changed from 'Pending' to match enum
        attachment
      } = req.body;

      // Validate required fields
      if (!patientId || !providerId || !testName || !testType || !result) {
        return res.status(400).json(errorResponse('Patient ID, provider ID, test name, test type, and result are required'));
      }

      // Check if patient exists
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        return res.status(404).json(errorResponse('Patient not found'));
      }

      // Check if provider exists
      const provider = await prisma.user.findUnique({ 
        where: { 
          id: providerId 
        }
      });
      if (!provider) {
        return res.status(404).json(errorResponse('Provider not found'));
      }

      const labResult = await prisma.labResult.create({
        data: {
          patientId,
          providerId, // ✅ Changed from doctorId to providerId
          testName,
          testType,
          result,
          normalRange,
          units,
          notes,
          performedAt: performedAt ? new Date(performedAt) : null,
          status,
          attachment
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

      res.status(201).json(successResponse({ labResult }, 'Lab result created successfully'));

    } catch (error) {
      next(error);
    }
  },

  updateLabResult: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const labResult = await prisma.labResult.findUnique({ where: { id } });
      if (!labResult) {
        return res.status(404).json(errorResponse('Lab result not found'));
      }

      // Convert date field
      if (updateData.performedAt) updateData.performedAt = new Date(updateData.performedAt);

      // ✅ Rename doctorId to providerId if present
      if (updateData.doctorId) {
        updateData.providerId = updateData.doctorId;
        delete updateData.doctorId;
      }

      const updatedLabResult = await prisma.labResult.update({
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

      res.json(successResponse({ labResult: updatedLabResult }, 'Lab result updated successfully'));

    } catch (error) {
      next(error);
    }
  },

  deleteLabResult: async (req, res, next) => {
    try {
      const { id } = req.params;

      const labResult = await prisma.labResult.findUnique({ where: { id } });
      if (!labResult) {
        return res.status(404).json(errorResponse('Lab result not found'));
      }

      await prisma.labResult.delete({ where: { id } });

      res.json(successResponse(null, 'Lab result deleted successfully'));

    } catch (error) {
      next(error);
    }
  },

  getPatientLabResults: async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const { testType, status } = req.query;

      const where = { patientId };
      if (testType) where.testType = testType;
      if (status) where.status = status;

      const labResults = await prisma.labResult.findMany({
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
          }
        },
        orderBy: { reportedAt: 'desc' }
      });

      res.json(successResponse({ labResults }));

    } catch (error) {
      next(error);
    }
  },

  updateLabResultStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json(errorResponse('Status is required'));
      }

      const labResult = await prisma.labResult.findUnique({ where: { id } });
      if (!labResult) {
        return res.status(404).json(errorResponse('Lab result not found'));
      }

      const updatedLabResult = await prisma.labResult.update({
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

      res.json(successResponse({ labResult: updatedLabResult }, 'Lab result status updated successfully'));

    } catch (error) {
      next(error);
    }
  }
};

module.exports = { labResultController };