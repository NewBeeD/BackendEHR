// src/controllers/medicalRecordsController.js
const prisma = require('../config/database');
const { successResponse, errorResponse } = require('../utils/utils');
const { medicalRecordValidation } = require('../utils/validation');

const medicalRecordsController = {
  createMedicalRecord: async (req, res) => {
    try {
      const { error, value } = medicalRecordValidation.create.validate(req.body);
      if (error) {
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

      // Log creation
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
      res.status(500).json(errorResponse('Failed to create medical record.'));
    }
  },

  getPatientMedicalRecords: async (req, res) => {
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

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
      res.status(500).json(errorResponse('Failed to retrieve medical records.'));
    }
  }
};

module.exports = medicalRecordsController;