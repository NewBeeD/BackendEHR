// src/controllers/emergencyAccessController.js
const prisma = require('../config/database');
const { successResponse, errorResponse, generateToken } = require('../utils/utils');
const auditService = require('../services/auditService');

const emergencyAccessController = {
  // Create emergency access token (for patient or authorized user)
  createEmergencyAccess: async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const { providerId, durationHours = 24, reason } = req.body;

      // Verify requester has authority
      const isAuthorized = req.user.role === 'Admin' || 
                          req.user.id === patientId || 
                          await isPrimaryProvider(req.user.id, patientId);

      if (!isAuthorized) {
        return res.status(403).json(errorResponse('Not authorized to create emergency access'));
      }

      const accessToken = generateToken({
        patientId,
        providerId,
        emergency: true,
        timestamp: Date.now()
      });

      const accessGrant = await prisma.accessGrant.create({
        data: {
          patientId,
          providerId,
          grantedBy: req.user.id,
          expiresAt: new Date(Date.now() + (durationHours * 60 * 60 * 1000)),
          permissions: {
            set: ['VIEW_RECORDS', 'VIEW_LAB_RESULTS', 'VIEW_PRESCRIPTIONS']
          },
          accessToken,
          status: 'ACTIVE'
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

      // Emergency audit log
      await auditService.log('EMERGENCY_ACCESS_CREATED', 'AccessGrant', {
        userId: req.user.id,
        userEmail: req.user.email,
        userRole: req.user.role,
        resourceId: accessGrant.id,
        description: `Created emergency access for provider ${providerId} to patient ${patientId}. Reason: ${reason}`,
        severity: 'Critical'
      });

      res.status(201).json(successResponse(
        { accessGrant, accessToken },
        'Emergency access created successfully'
      ));

    } catch (error) {
      next(error);
    }
  },

  // Use emergency access token
  useEmergencyAccess: async (req, res, next) => {
    try {
      const { patientId, accessToken } = req.params;

      const accessGrant = await prisma.accessGrant.findFirst({
        where: {
          accessToken,
          patientId,
          status: 'ACTIVE',
          expiresAt: { gt: new Date() }
        },
        include: {
          patient: true
        }
      });

      if (!accessGrant) {
        return res.status(403).json(errorResponse('Invalid or expired emergency access token'));
      }

      // Return limited patient data for emergency use
      const emergencyData = {
        patient: {
          id: accessGrant.patient.id,
          firstName: accessGrant.patient.firstName,
          lastName: accessGrant.patient.lastName,
          dateOfBirth: accessGrant.patient.dateOfBirth,
          gender: accessGrant.patient.gender,
          bloodGroup: accessGrant.patient.bloodGroup,
          allergies: accessGrant.patient.allergies,
          medications: accessGrant.patient.medications,
          conditions: accessGrant.patient.conditions
        },
        accessGrant: {
          id: accessGrant.id,
          expiresAt: accessGrant.expiresAt
        }
      };

      // Log emergency access
      await auditService.log('EMERGENCY_ACCESS_USED', 'AccessGrant', {
        userId: 'EMERGENCY_PROVIDER',
        resourceId: accessGrant.id,
        description: `Emergency access used for patient ${patientId}`,
        severity: 'Critical'
      });

      res.json(successResponse({ emergencyData }));

    } catch (error) {
      next(error);
    }
  }
};

module.exports = { emergencyAccessController };