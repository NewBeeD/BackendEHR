// // src/controllers/appointmentController.js
// const prisma = require('../config/database');
// const { appointmentValidation } = require('../utils/validation');
// const { successResponse, errorResponse, sendEmail } = require('../utils/utils');

// const appointmentController = {
//   getAllAppointments: async (req, res, next) => {
//     try {
//       const {
//         page = 1,
//         limit = 10,
//         status,
//         doctorId,
//         patientId,
//         startDate,
//         endDate,
//         sortBy = 'appointmentDate',
//         sortOrder = 'asc'
//       } = req.query;

//       const skip = (page - 1) * limit;

//       // Build filter conditions
//       const where = {};
      
//       if (status) where.status = status;
//       if (doctorId) where.doctorId = doctorId;
//       if (patientId) where.patientId = patientId;
      
//       if (startDate || endDate) {
//         where.appointmentDate = {};
//         if (startDate) where.appointmentDate.gte = new Date(startDate);
//         if (endDate) where.appointmentDate.lte = new Date(endDate);
//       }

//       const [appointments, total] = await Promise.all([
//         prisma.appointment.findMany({
//           where,
//           include: {
//             patient: {
//               select: {
//                 id: true,
//                 patientId: true,
//                 firstName: true,
//                 lastName: true,
//                 phone: true,
//                 email: true
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
//             medicalRecord: true
//           },
//           orderBy: { [sortBy]: sortOrder },
//           skip: parseInt(skip),
//           take: parseInt(limit)
//         }),
//         prisma.appointment.count({ where })
//       ]);

//       res.json(successResponse({
//         appointments,
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

//   getAppointment: async (req, res, next) => {
//     try {
//       const { id } = req.params;

//       const appointment = await prisma.appointment.findUnique({
//         where: { id },
//         include: {
//           patient: {
//             include: {
//               emergencyContact: true,
//               insurance: true
//             }
//           },
//           doctor: {
//             include: {
//               profile: true
//             }
//           },
//           medicalRecord: {
//             include: {
//               prescriptions: true
//             }
//           },
//           billing: true
//         }
//       });

//       if (!appointment) {
//         return res.status(404).json(errorResponse('Appointment not found'));
//       }

//       res.json(successResponse({ appointment }));

//     } catch (error) {
//       next(error);
//     }
//   },

//   createAppointment: async (req, res, next) => {
//     try {
//       const { error, value } = appointmentValidation.create.validate(req.body);
//       if (error) {
//         return res.status(400).json(errorResponse(error.details[0].message));
//       }

//       // Check if patient exists
//       const patient = await prisma.patient.findUnique({
//         where: { id: value.patientId }
//       });
//       if (!patient) {
//         return res.status(404).json(errorResponse('Patient not found'));
//       }

//       // Check if doctor exists
//       const doctor = await prisma.user.findUnique({
//         where: { 
//           id: value.doctorId,
//           role: 'Doctor'
//         }
//       });
//       if (!doctor) {
//         return res.status(404).json(errorResponse('Doctor not found'));
//       }

//       // Check for scheduling conflicts
//       const existingAppointment = await prisma.appointment.findFirst({
//         where: {
//           doctorId: value.doctorId,
//           appointmentDate: value.appointmentDate,
//           status: {
//             in: ['Scheduled', 'Confirmed']
//           }
//         }
//       });

//       if (existingAppointment) {
//         return res.status(400).json(errorResponse('Doctor is not available at this time'));
//       }

//       const appointment = await prisma.appointment.create({
//         data: value,
//         include: {
//           patient: {
//             select: {
//               firstName: true,
//               lastName: true,
//               phone: true,
//               email: true
//             }
//           },
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
//         }
//       });

//       // Send confirmation email (in production)
//       try {
//         await sendEmail(
//           patient.email,
//           'Appointment Confirmation',
//           `
//           <h2>Appointment Confirmed</h2>
//           <p>Dear ${patient.firstName} ${patient.lastName},</p>
//           <p>Your appointment has been scheduled with Dr. ${doctor.profile.firstName} ${doctor.profile.lastName}.</p>
//           <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleString()}</p>
//           <p><strong>Reason:</strong> ${appointment.reason}</p>
//           <p>Please arrive 15 minutes before your scheduled time.</p>
//           `
//         );
//       } catch (emailError) {
//         console.error('Failed to send email:', emailError);
//       }

//       res.status(201).json(successResponse({ appointment }, 'Appointment created successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   updateAppointment: async (req, res, next) => {
//     try {
//       const { id } = req.params;
//       const { error, value } = appointmentValidation.update.validate(req.body);
//       if (error) {
//         return res.status(400).json(errorResponse(error.details[0].message));
//       }

//       const appointment = await prisma.appointment.findUnique({
//         where: { id },
//         include: {
//           patient: true,
//           doctor: {
//             include: { profile: true }
//           }
//         }
//       });

//       if (!appointment) {
//         return res.status(404).json(errorResponse('Appointment not found'));
//       }

//       const updatedAppointment = await prisma.appointment.update({
//         where: { id },
//         data: value,
//         include: {
//           patient: {
//             select: {
//               firstName: true,
//               lastName: true,
//               phone: true,
//               email: true
//             }
//           },
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
//         }
//       });

//       // Notify patient if status changed
//       if (value.status && value.status !== appointment.status) {
//         try {
//           await sendEmail(
//             appointment.patient.email,
//             'Appointment Status Update',
//             `
//             <h2>Appointment Status Updated</h2>
//             <p>Dear ${appointment.patient.firstName} ${appointment.patient.lastName},</p>
//             <p>Your appointment with Dr. ${appointment.doctor.profile.firstName} ${appointment.doctor.profile.lastName} has been updated to: <strong>${value.status}</strong></p>
//             <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleString()}</p>
//             ${value.notes ? `<p><strong>Notes:</strong> ${value.notes}</p>` : ''}
//             `
//           );
//         } catch (emailError) {
//           console.error('Failed to send email:', emailError);
//         }
//       }

//       res.json(successResponse({ appointment: updatedAppointment }, 'Appointment updated successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   deleteAppointment: async (req, res, next) => {
//     try {
//       const { id } = req.params;

//       const appointment = await prisma.appointment.findUnique({ where: { id } });
//       if (!appointment) {
//         return res.status(404).json(errorResponse('Appointment not found'));
//       }

//       await prisma.appointment.delete({ where: { id } });

//       res.json(successResponse(null, 'Appointment deleted successfully'));

//     } catch (error) {
//       next(error);
//     }
//   },

//   getDoctorAppointments: async (req, res, next) => {
//     try {
//       const { doctorId } = req.params;
//       const { date } = req.query;

//       const where = { doctorId };
      
//       if (date) {
//         const startDate = new Date(date);
//         const endDate = new Date(date);
//         endDate.setDate(endDate.getDate() + 1);
        
//         where.appointmentDate = {
//           gte: startDate,
//           lt: endDate
//         };
//       }

//       const appointments = await prisma.appointment.findMany({
//         where,
//         include: {
//           patient: {
//             select: {
//               id: true,
//               patientId: true,
//               firstName: true,
//               lastName: true,
//               phone: true
//             }
//           }
//         },
//         orderBy: { appointmentDate: 'asc' }
//       });

//       res.json(successResponse({ appointments }));

//     } catch (error) {
//       next(error);
//     }
//   },

//   getTodayAppointments: async (req, res, next) => {
//     try {
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);
      
//       const tomorrow = new Date(today);
//       tomorrow.setDate(tomorrow.getDate() + 1);

//       const appointments = await prisma.appointment.findMany({
//         where: {
//           appointmentDate: {
//             gte: today,
//             lt: tomorrow
//           },
//           status: {
//             in: ['Scheduled', 'Confirmed']
//           }
//         },
//         include: {
//           patient: {
//             select: {
//               id: true,
//               patientId: true,
//               firstName: true,
//               lastName: true,
//               phone: true
//             }
//           },
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
//         orderBy: { appointmentDate: 'asc' }
//       });

//       res.json(successResponse({ appointments }));

//     } catch (error) {
//       next(error);
//     }
//   }
// };

// module.exports = { appointmentController };




// src/controllers/appointmentController.js
const prisma = require('../config/database');
const { appointmentValidation } = require('../utils/validation');
const { successResponse, errorResponse, sendEmail } = require('../utils/utils');

const appointmentController = {
  
  getAllAppointments: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        providerId, // ✅ Changed from doctorId to providerId
        patientId,
        startDate,
        endDate,
        sortBy = 'appointmentDate',
        sortOrder = 'asc'
      } = req.query;

      const skip = (page - 1) * limit;

      // Build filter conditions
      const where = {};
      
      if (status) where.status = status;
      if (providerId) where.providerId = providerId; // ✅ Changed from doctorId to providerId
      if (patientId) where.patientId = patientId;
      
      if (startDate || endDate) {
        where.appointmentDate = {};
        if (startDate) where.appointmentDate.gte = new Date(startDate);
        if (endDate) where.appointmentDate.lte = new Date(endDate);
      }

      const [appointments, total] = await Promise.all([
        prisma.appointment.findMany({
          where,
          include: {
            patient: {
              select: {
                id: true,
                mrn: true, // ✅ Changed from patientId to mrn
                firstName: true,
                lastName: true,
                phone: true,
                email: true
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
            medicalRecord: true
          },
          orderBy: { [sortBy]: sortOrder },
          skip: parseInt(skip),
          take: parseInt(limit)
        }),
        prisma.appointment.count({ where })
      ]);

      res.json(successResponse({
        appointments,
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

  getAppointment: async (req, res, next) => {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          patient: {
            include: {
              emergencyContact: true,
              insurance: true
            }
          },
          provider: { // ✅ Changed from doctor to provider
            include: {
              profile: true
            }
          },
          medicalRecord: {
            include: {
              prescriptions: true
            }
          },
          billing: true
        }
      });

      if (!appointment) {
        return res.status(404).json(errorResponse('Appointment not found'));
      }

      res.json(successResponse({ appointment }));

    } catch (error) {
      next(error);
    }
  },

  createAppointment: async (req, res, next) => {
    try {
      const { error, value } = appointmentValidation.create.validate(req.body);
      if (error) {
        return res.status(400).json(errorResponse(error.details[0].message));
      }

      // Check if patient exists
      const patient = await prisma.patient.findUnique({
        where: { id: value.patientId }
      });
      if (!patient) {
        return res.status(404).json(errorResponse('Patient not found'));
      }

      // Check if provider exists and has appropriate role
      const provider = await prisma.user.findUnique({
        where: { 
          id: value.providerId // ✅ Changed from doctorId to providerId
        },
        include: {
          profile: true,
          staff: true
        }
      });
      
      if (!provider) {
        return res.status(404).json(errorResponse('Provider not found'));
      }

      // Check if provider has appropriate role for appointments
      const allowedRoles = ['DOCTOR', 'NURSE', 'NURSE_PRACTITIONER'];
      if (!allowedRoles.includes(provider.role)) {
        return res.status(400).json(errorResponse('This user cannot have appointments scheduled'));
      }

      // Check for scheduling conflicts
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          providerId: value.providerId, // ✅ Changed from doctorId to providerId
          appointmentDate: value.appointmentDate,
          status: {
            in: ['SCHEDULED', 'CONFIRMED'] // ✅ Changed to uppercase enum values
          }
        }
      });

      if (existingAppointment) {
        return res.status(400).json(errorResponse('Provider is not available at this time'));
      }

      const appointment = await prisma.appointment.create({
        data: {
          ...value,
          providerId: value.providerId // ✅ Ensure providerId is used
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
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
              },
              staff: { // ✅ Added staff to get specialization
                select: {
                  specialization: true
                }
              }
            }
          }
        }
      });

      // Send confirmation email (in production)
      try {
        await sendEmail(
          patient.email,
          'Appointment Confirmation',
          `
          <h2>Appointment Confirmed</h2>
          <p>Dear ${patient.firstName} ${patient.lastName},</p>
          <p>Your appointment has been scheduled with ${provider.profile.firstName} ${provider.profile.lastName}.</p>
          <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleString()}</p>
          <p><strong>Reason:</strong> ${appointment.reason}</p>
          <p>Please arrive 15 minutes before your scheduled time.</p>
          `
        );
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
      }

      res.status(201).json(successResponse({ appointment }, 'Appointment created successfully'));

    } catch (error) {
      next(error);
    }
  },

  updateAppointment: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { error, value } = appointmentValidation.update.validate(req.body);
      if (error) {
        return res.status(400).json(errorResponse(error.details[0].message));
      }

      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          patient: true,
          provider: { // ✅ Changed from doctor to provider
            include: { 
              profile: true,
              staff: true 
            }
          }
        }
      });

      if (!appointment) {
        return res.status(404).json(errorResponse('Appointment not found'));
      }

      // ✅ Rename doctorId to providerId if present
      if (value.doctorId) {
        value.providerId = value.doctorId;
        delete value.doctorId;
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: value,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
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
              },
              staff: { // ✅ Added staff to get specialization
                select: {
                  specialization: true
                }
              }
            }
          }
        }
      });

      // Notify patient if status changed
      if (value.status && value.status !== appointment.status) {
        try {
          await sendEmail(
            appointment.patient.email,
            'Appointment Status Update',
            `
            <h2>Appointment Status Updated</h2>
            <p>Dear ${appointment.patient.firstName} ${appointment.patient.lastName},</p>
            <p>Your appointment with ${appointment.provider.profile.firstName} ${appointment.provider.profile.lastName} has been updated to: <strong>${value.status}</strong></p>
            <p><strong>Date:</strong> ${new Date(appointment.appointmentDate).toLocaleString()}</p>
            ${value.notes ? `<p><strong>Notes:</strong> ${value.notes}</p>` : ''}
            `
          );
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
        }
      }

      res.json(successResponse({ appointment: updatedAppointment }, 'Appointment updated successfully'));

    } catch (error) {
      next(error);
    }
  },

  deleteAppointment: async (req, res, next) => {
    try {
      const { id } = req.params;

      const appointment = await prisma.appointment.findUnique({ where: { id } });
      if (!appointment) {
        return res.status(404).json(errorResponse('Appointment not found'));
      }

      await prisma.appointment.delete({ where: { id } });

      res.json(successResponse(null, 'Appointment deleted successfully'));

    } catch (error) {
      next(error);
    }
  },

  getProviderAppointments: async (req, res, next) => { // ✅ Changed from getDoctorAppointments to getProviderAppointments
    try {
      const { providerId } = req.params; // ✅ Changed from doctorId to providerId
      const { date } = req.query;

      const where = { providerId }; // ✅ Changed from doctorId to providerId
      
      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 1);
        
        where.appointmentDate = {
          gte: startDate,
          lt: endDate
        };
      }

      const appointments = await prisma.appointment.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              mrn: true, // ✅ Changed from patientId to mrn
              firstName: true,
              lastName: true,
              phone: true
            }
          }
        },
        orderBy: { appointmentDate: 'asc' }
      });

      res.json(successResponse({ appointments }));

    } catch (error) {
      next(error);
    }
  },

  getTodayAppointments: async (req, res, next) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: today,
            lt: tomorrow
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED'] // ✅ Changed to uppercase enum values
          }
        },
        include: {
          patient: {
            select: {
              id: true,
              mrn: true, // ✅ Changed from patientId to mrn
              firstName: true,
              lastName: true,
              phone: true
            }
          },
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
        orderBy: { appointmentDate: 'asc' }
      });

      res.json(successResponse({ appointments }));

    } catch (error) {
      next(error);
    }
  }
};

module.exports = { appointmentController };