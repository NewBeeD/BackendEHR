// // src/controllers/billingController.js
// const prisma = require('../config/database');
// const { successResponse, errorResponse } = require('../utils/utils');

// const billingController = {
//   getAllBilling: async (req, res, next) => {
//     try {
//       const {
//         page = 1,
//         limit = 10,
//         patientId,
//         doctorId,
//         status,
//         startDate,
//         endDate,
//         sortBy = 'createdAt',
//         sortOrder = 'desc'
//       } = req.query;

//       const skip = (page - 1) * limit;

//       const where = {};
//       if (patientId) where.patientId = patientId;
//       if (doctorId) where.doctorId = doctorId;
//       if (status) where.status = status;
      
//       if (startDate || endDate) {
//         where.serviceDate = {};
//         if (startDate) where.serviceDate.gte = new Date(startDate);
//         if (endDate) where.serviceDate.lte = new Date(endDate);
//       }

//       const [billing, total] = await Promise.all([
//         prisma.billing.findMany({
//           where,
//           include: {
//             patient: {
//               select: {
//                 id: true,
//                 patientId: true,
//                 firstName: true,
//                 lastName: true,
//                 insurance: true
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
//             },
//             appointment: {
//               select: {
//                 type: true,
//                 reason: true
//               }
//             }
//           },
//           orderBy: { [sortBy]: sortOrder },
//           skip: parseInt(skip),
//           take: parseInt(limit)
//         }),
//         prisma.billing.count({ where })
//       ]);

//       res.json(successResponse({
//         billing,
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

//   getBilling: async (req, res, next) => {
//     try {
//       const { id } = req.params;

//       const bill = await prisma.billing.findUnique({
//         where: { id },
//         include: {
//           patient: {
//             include: {
//               insurance: true
//             }
//           },
//           doctor: {
//             include: {
//               profile: true
//             }
//           },
//           appointment: true
//         }
//       });

//       if (!bill) {
//         return res.status(404).json(errorResponse('Bill not found'));
//       }

//       res.json(successResponse({ bill }));

//     } catch (error) {
//       next(error);
//     }
//   },

//   createBilling: async (req, res, next) => {
//     try {
//       const {
//         patientId,
//         doctorId,
//         appointmentId,
//         amount,
//         serviceDate,
//         dueDate,
//         notes,
//         insuranceClaimId
//       } = req.body;

//       // Validate required fields
//       if (!patientId || !doctorId || !amount || !serviceDate) {
//         return res.status(400).json(errorResponse('Patient ID, doctor ID, amount, and service date are required'));
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

//       // If appointmentId is provided, verify it exists
//       if (appointmentId) {
//         const appointment = await prisma.appointment.findUnique({
//           where: { id: appointmentId }
//         });
//         if (!appointment) {
//           return res.status(404).json(errorResponse('Appointment not found'));
//         }
//       }

//       const bill = await prisma.billing.create({
//         data: {
//           patientId,
//           doctorId,
//           appointmentId,
//           amount: parseFloat(amount),
//           serviceDate: new Date(serviceDate),
//           dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
//           notes,
//           insuranceClaimId
//         },
//         include: {
//           patient: {
//             select: {
//               firstName: true,
//               lastName: true,
//               email: true
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

//       res.status(201).json(successResponse({ bill }, 'Bill created successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   updateBilling: async (req, res, next) => {
//     try {
//       const { id } = req.params;
//       const updateData = req.body;

//       const bill = await prisma.billing.findUnique({ where: { id } });
//       if (!bill) {
//         return res.status(404).json(errorResponse('Bill not found'));
//       }

//       // Convert numeric and date fields
//       if (updateData.amount) updateData.amount = parseFloat(updateData.amount);
//       if (updateData.serviceDate) updateData.serviceDate = new Date(updateData.serviceDate);
//       if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
//       if (updateData.paidDate) updateData.paidDate = new Date(updateData.paidDate);

//       const updatedBill = await prisma.billing.update({
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

//       res.json(successResponse({ bill: updatedBill }, 'Bill updated successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   deleteBilling: async (req, res, next) => {
//     try {
//       const { id } = req.params;

//       const bill = await prisma.billing.findUnique({ where: { id } });
//       if (!bill) {
//         return res.status(404).json(errorResponse('Bill not found'));
//       }

//       await prisma.billing.delete({ where: { id } });

//       res.json(successResponse(null, 'Bill deleted successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   getPatientBilling: async (req, res, next) => {
//     try {
//       const { patientId } = req.params;
//       const { status } = req.query;

//       const where = { patientId };
//       if (status) where.status = status;

//       const billing = await prisma.billing.findMany({
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
//           appointment: {
//             select: {
//               type: true,
//               reason: true
//             }
//           }
//         },
//         orderBy: { createdAt: 'desc' }
//       });

//       res.json(successResponse({ billing }));

//     } catch (error) {
//       next(error);
//     }
//   },

//   updatePaymentStatus: async (req, res, next) => {
//     try {
//       const { id } = req.params;
//       const { status, paymentMethod, paidDate } = req.body;

//       if (!status) {
//         return res.status(400).json(errorResponse('Status is required'));
//       }

//       const bill = await prisma.billing.findUnique({ where: { id } });
//       if (!bill) {
//         return res.status(404).json(errorResponse('Bill not found'));
//       }

//       const updateData = { status };
//       if (paymentMethod) updateData.paymentMethod = paymentMethod;
//       if (paidDate) updateData.paidDate = new Date(paidDate);
//       if (status === 'Paid' && !paidDate) updateData.paidDate = new Date();

//       const updatedBill = await prisma.billing.update({
//         where: { id },
//         data: updateData,
//         include: {
//           patient: {
//             select: {
//               firstName: true,
//               lastName: true,
//               email: true
//             }
//           }
//         }
//       });

//       res.json(successResponse({ bill: updatedBill }, 'Payment status updated successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   getBillingSummary: async (req, res, next) => {
//     try {
//       const { startDate, endDate } = req.query;

//       const where = {};
//       if (startDate || endDate) {
//         where.serviceDate = {};
//         if (startDate) where.serviceDate.gte = new Date(startDate);
//         if (endDate) where.serviceDate.lte = new Date(endDate);
//       }

//       const billing = await prisma.billing.findMany({
//         where,
//         include: {
//           patient: {
//             select: {
//               firstName: true,
//               lastName: true
//             }
//           }
//         }
//       });

//       const summary = {
//         totalAmount: billing.reduce((sum, bill) => sum + bill.amount, 0),
//         paidAmount: billing.filter(b => b.status === 'Paid').reduce((sum, bill) => sum + bill.amount, 0),
//         pendingAmount: billing.filter(b => b.status === 'Pending').reduce((sum, bill) => sum + bill.amount, 0),
//         totalBills: billing.length,
//         paidBills: billing.filter(b => b.status === 'Paid').length,
//         pendingBills: billing.filter(b => b.status === 'Pending').length,
//         byStatus: billing.reduce((acc, bill) => {
//           acc[bill.status] = (acc[bill.status] || 0) + 1;
//           return acc;
//         }, {})
//       };

//       res.json(successResponse({ summary }));

//     } catch (error) {
//       next(error);
//     }
//   }
// };

// module.exports = { billingController };




// src/controllers/billingController.js
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/utils');

const billingController = {
  getAllBilling: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        patientId,
        providerId, // ✅ Changed from doctorId to providerId
        status,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;

      const where = {};
      if (patientId) where.patientId = patientId;
      if (providerId) where.providerId = providerId; // ✅ Changed from doctorId to providerId
      if (status) where.status = status;
      
      if (startDate || endDate) {
        where.serviceDate = {};
        if (startDate) where.serviceDate.gte = new Date(startDate);
        if (endDate) where.serviceDate.lte = new Date(endDate);
      }

      const [billing, total] = await Promise.all([
        prisma.billing.findMany({
          where,
          include: {
            patient: {
              select: {
                id: true,
                mrn: true, // ✅ Changed from patientId to mrn
                firstName: true,
                lastName: true,
                insurance: true
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
            appointment: {
              select: {
                type: true,
                reason: true
              }
            }
          },
          orderBy: { [sortBy]: sortOrder },
          skip: parseInt(skip),
          take: parseInt(limit)
        }),
        prisma.billing.count({ where })
      ]);

      res.json(successResponse({
        billing,
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

  getBilling: async (req, res, next) => {
    try {
      const { id } = req.params;

      const bill = await prisma.billing.findUnique({
        where: { id },
        include: {
          patient: {
            include: {
              insurance: true
            }
          },
          provider: { // ✅ Changed from doctor to provider
            include: {
              profile: true
            }
          },
          appointment: true
        }
      });

      if (!bill) {
        return res.status(404).json(errorResponse('Bill not found'));
      }

      res.json(successResponse({ bill }));

    } catch (error) {
      next(error);
    }
  },

  createBilling: async (req, res, next) => {
    try {
      const {
        patientId,
        providerId, // ✅ Changed from doctorId to providerId
        appointmentId,
        amount,
        serviceDate,
        dueDate,
        notes,
        insuranceClaimId
      } = req.body;

      // Validate required fields
      if (!patientId || !providerId || !amount || !serviceDate) {
        return res.status(400).json(errorResponse('Patient ID, provider ID, amount, and service date are required'));
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

      // If appointmentId is provided, verify it exists
      if (appointmentId) {
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId }
        });
        if (!appointment) {
          return res.status(404).json(errorResponse('Appointment not found'));
        }
      }

      const bill = await prisma.billing.create({
        data: {
          patientId,
          providerId, // ✅ Changed from doctorId to providerId
          appointmentId,
          amount: parseFloat(amount),
          serviceDate: new Date(serviceDate),
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
          notes,
          insuranceClaimId
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              email: true
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

      res.status(201).json(successResponse({ bill }, 'Bill created successfully'));

    } catch (error) {
      next(error);
    }
  },

  updateBilling: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const bill = await prisma.billing.findUnique({ where: { id } });
      if (!bill) {
        return res.status(404).json(errorResponse('Bill not found'));
      }

      // Convert numeric and date fields
      if (updateData.amount) updateData.amount = parseFloat(updateData.amount);
      if (updateData.serviceDate) updateData.serviceDate = new Date(updateData.serviceDate);
      if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);
      if (updateData.paidDate) updateData.paidDate = new Date(updateData.paidDate);

      // ✅ Rename doctorId to providerId if present
      if (updateData.doctorId) {
        updateData.providerId = updateData.doctorId;
        delete updateData.doctorId;
      }

      const updatedBill = await prisma.billing.update({
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

      res.json(successResponse({ bill: updatedBill }, 'Bill updated successfully'));

    } catch (error) {
      next(error);
    }
  },

  deleteBilling: async (req, res, next) => {
    try {
      const { id } = req.params;

      const bill = await prisma.billing.findUnique({ where: { id } });
      if (!bill) {
        return res.status(404).json(errorResponse('Bill not found'));
      }

      await prisma.billing.delete({ where: { id } });

      res.json(successResponse(null, 'Bill deleted successfully'));

    } catch (error) {
      next(error);
    }
  },

  getPatientBilling: async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const { status } = req.query;

      const where = { patientId };
      if (status) where.status = status;

      const billing = await prisma.billing.findMany({
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
          appointment: {
            select: {
              type: true,
              reason: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(successResponse({ billing }));

    } catch (error) {
      next(error);
    }
  },

  updatePaymentStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status, paymentMethod, paidDate } = req.body;

      if (!status) {
        return res.status(400).json(errorResponse('Status is required'));
      }

      const bill = await prisma.billing.findUnique({ where: { id } });
      if (!bill) {
        return res.status(404).json(errorResponse('Bill not found'));
      }

      const updateData = { status };
      if (paymentMethod) updateData.paymentMethod = paymentMethod;
      if (paidDate) updateData.paidDate = new Date(paidDate);
      if (status === 'Paid' && !paidDate) updateData.paidDate = new Date();

      const updatedBill = await prisma.billing.update({
        where: { id },
        data: updateData,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      res.json(successResponse({ bill: updatedBill }, 'Payment status updated successfully'));

    } catch (error) {
      next(error);
    }
  },

  getBillingSummary: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      const where = {};
      if (startDate || endDate) {
        where.serviceDate = {};
        if (startDate) where.serviceDate.gte = new Date(startDate);
        if (endDate) where.serviceDate.lte = new Date(endDate);
      }

      const billing = await prisma.billing.findMany({
        where,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      const summary = {
        totalAmount: billing.reduce((sum, bill) => sum + bill.amount, 0),
        paidAmount: billing.filter(b => b.status === 'PAID').reduce((sum, bill) => sum + bill.amount, 0), // ✅ Changed to 'PAID' (uppercase)
        pendingAmount: billing.filter(b => b.status === 'PENDING').reduce((sum, bill) => sum + bill.amount, 0), // ✅ Changed to 'PENDING' (uppercase)
        totalBills: billing.length,
        paidBills: billing.filter(b => b.status === 'PAID').length, // ✅ Changed to 'PAID'
        pendingBills: billing.filter(b => b.status === 'PENDING').length, // ✅ Changed to 'PENDING'
        byStatus: billing.reduce((acc, bill) => {
          acc[bill.status] = (acc[bill.status] || 0) + 1;
          return acc;
        }, {})
      };

      res.json(successResponse({ summary }));

    } catch (error) {
      next(error);
    }
  }
};

module.exports = { billingController };