// src/controllers/medicalRecordController.js
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/utils');

const medicalRecordController = {
  getAllMedicalRecords: async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        patientId,
        doctorId,
        startDate,
        endDate,
        sortBy = 'visitDate',
        sortOrder = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;

      const where = {};
      if (patientId) where.patientId = patientId;
      if (doctorId) where.doctorId = doctorId;
      
      if (startDate || endDate) {
        where.visitDate = {};
        if (startDate) where.visitDate.gte = new Date(startDate);
        if (endDate) where.visitDate.lte = new Date(endDate);
      }

      const [medicalRecords, total] = await Promise.all([
        prisma.medicalRecord.findMany({
          where,
          include: {
            patient: {
              select: {
                id: true,
                patientId: true,
                firstName: true,
                lastName: true
              }
            },
            doctor: {
              include: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    specialty: true
                  }
                }
              }
            },
            prescriptions: true,
            appointment: true
          },
          orderBy: { [sortBy]: sortOrder },
          skip: parseInt(skip),
          take: parseInt(limit)
        }),
        prisma.medicalRecord.count({ where })
      ]);

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
      next(error);
    }
  },

  getMedicalRecord: async (req, res, next) => {
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
          doctor: {
            include: {
              profile: true
            }
          },
          prescriptions: {
            include: {
              doctor: {
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
          },
          appointment: true
        }
      });

      if (!medicalRecord) {
        return res.status(404).json(errorResponse('Medical record not found'));
      }

      res.json(successResponse({ medicalRecord }));

    } catch (error) {
      next(error);
    }
  },

  createMedicalRecord: async (req, res, next) => {
    try {
      const {
        patientId,
        doctorId,
        appointmentId,
        diagnosis,
        symptoms,
        treatment,
        notes,
        height,
        weight,
        temperature,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        heartRate,
        respiratoryRate,
        followUpDate
      } = req.body;

      // Validate required fields
      if (!patientId || !doctorId || !diagnosis) {
        return res.status(400).json(errorResponse('Patient ID, doctor ID, and diagnosis are required'));
      }

      // Check if patient exists
      const patient = await prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) {
        return res.status(404).json(errorResponse('Patient not found'));
      }

      // Check if doctor exists
      const doctor = await prisma.user.findUnique({ 
        where: { 
          id: doctorId,
          role: 'Doctor'
        }
      });
      if (!doctor) {
        return res.status(404).json(errorResponse('Doctor not found'));
      }

      // If appointmentId is provided, verify it exists and belongs to the patient
      if (appointmentId) {
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId }
        });
        
        if (!appointment || appointment.patientId !== patientId) {
          return res.status(400).json(errorResponse('Invalid appointment ID'));
        }

        // Update appointment status to completed
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { status: 'Completed' }
        });
      }

      const medicalRecord = await prisma.medicalRecord.create({
        data: {
          patientId,
          doctorId,
          appointmentId,
          diagnosis,
          symptoms,
          treatment,
          notes,
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
          temperature: temperature ? parseFloat(temperature) : null,
          bloodPressureSystolic: bloodPressureSystolic ? parseInt(bloodPressureSystolic) : null,
          bloodPressureDiastolic: bloodPressureDiastolic ? parseInt(bloodPressureDiastolic) : null,
          heartRate: heartRate ? parseInt(heartRate) : null,
          respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null,
          followUpDate: followUpDate ? new Date(followUpDate) : null
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          doctor: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          prescriptions: true
        }
      });

      res.status(201).json(successResponse({ medicalRecord }, 'Medical record created successfully'));

    } catch (error) {
      next(error);
    }
  },

  updateMedicalRecord: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const medicalRecord = await prisma.medicalRecord.findUnique({ where: { id } });
      if (!medicalRecord) {
        return res.status(404).json(errorResponse('Medical record not found'));
      }

      // Convert numeric fields
      if (updateData.height) updateData.height = parseFloat(updateData.height);
      if (updateData.weight) updateData.weight = parseFloat(updateData.weight);
      if (updateData.temperature) updateData.temperature = parseFloat(updateData.temperature);
      if (updateData.bloodPressureSystolic) updateData.bloodPressureSystolic = parseInt(updateData.bloodPressureSystolic);
      if (updateData.bloodPressureDiastolic) updateData.bloodPressureDiastolic = parseInt(updateData.bloodPressureDiastolic);
      if (updateData.heartRate) updateData.heartRate = parseInt(updateData.heartRate);
      if (updateData.respiratoryRate) updateData.respiratoryRate = parseInt(updateData.respiratoryRate);
      if (updateData.followUpDate) updateData.followUpDate = new Date(updateData.followUpDate);

      const updatedMedicalRecord = await prisma.medicalRecord.update({
        where: { id },
        data: updateData,
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          doctor: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          prescriptions: true
        }
      });

      res.json(successResponse({ medicalRecord: updatedMedicalRecord }, 'Medical record updated successfully'));

    } catch (error) {
      next(error);
    }
  },

  deleteMedicalRecord: async (req, res, next) => {
    try {
      const { id } = req.params;

      const medicalRecord = await prisma.medicalRecord.findUnique({ where: { id } });
      if (!medicalRecord) {
        return res.status(404).json(errorResponse('Medical record not found'));
      }

      await prisma.medicalRecord.delete({ where: { id } });

      res.json(successResponse(null, 'Medical record deleted successfully'));

    } catch (error) {
      next(error);
    }
  },

  getPatientMedicalRecords: async (req, res, next) => {
    try {
      const { patientId } = req.params;

      const medicalRecords = await prisma.medicalRecord.findMany({
        where: { patientId },
        include: {
          doctor: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  specialty: true
                }
              }
            }
          },
          prescriptions: true
        },
        orderBy: { visitDate: 'desc' }
      });

      res.json(successResponse({ medicalRecords }));

    } catch (error) {
      next(error);
    }
  }
};

module.exports = { medicalRecordController };