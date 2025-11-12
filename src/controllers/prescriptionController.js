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
        doctorId,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const skip = (page - 1) * limit;

      const where = {};
      if (patientId) where.patientId = patientId;
      if (doctorId) where.doctorId = doctorId;
      if (status) where.status = status;

      const [prescriptions, total] = await Promise.all([
        prisma.prescription.findMany({
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
            medicalRecord: {
              select: {
                diagnosis: true,
                visitDate: true
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
          doctor: {
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
        doctorId,
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
      if (!patientId || !doctorId || !medication || !dosage || !frequency || !duration || !startDate) {
        return res.status(400).json(errorResponse('Patient ID, doctor ID, medication, dosage, frequency, duration, and start date are required'));
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
          doctorId,
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
          medicalRecord: {
            select: {
              diagnosis: true,
              visitDate: true
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