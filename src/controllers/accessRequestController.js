// src/controllers/accessRequestController.js
const prisma = require('../config/database');
const { successResponse, errorResponse, sendEmail, generateToken } = require('../utils/utils');
const auditService = require('../services/auditService');

const accessRequestController = {
  // Provider requests access to patient records
  requestAccess: async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const providerId = req.user.id;
      const {
        requestType,
        reason,
        requestedRecords = [],
        durationHours = 24
      } = req.body;

      // Validate input
      if (!requestType || !reason) {
        return res.status(400).json(errorResponse('Request type and reason are required'));
      }

      // Check if patient exists
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: { user: true }
      });

      if (!patient) {
        return res.status(404).json(errorResponse('Patient not found'));
      }

      // Check for existing pending request
      const existingRequest = await prisma.accessRequest.findFirst({
        where: {
          patientId,
          providerId,
          status: 'PENDING'
        }
      });

      if (existingRequest) {
        return res.status(400).json(errorResponse('You already have a pending access request for this patient'));
      }

      // Generate access token for secure approval
      const accessToken = generateToken({ patientId, providerId });

      // Create access request
      const accessRequest = await prisma.accessRequest.create({
        data: {
          patientId,
          providerId,
          requestType,
          reason,
          requestedRecords: {
            set: requestedRecords
          },
          durationHours,
          expiresAt: new Date(Date.now() + (durationHours * 60 * 60 * 1000)),
          accessToken
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          },
          provider: {
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  specialty: true
                }
              }
            }
          }
        }
      });

      // Send notification to patient
      try {
        await sendEmail(
          patient.user.email,
          'New Access Request for Your Medical Records',
          `
          <h2>Medical Records Access Request</h2>
          <p>Dear ${patient.firstName} ${patient.lastName},</p>
          <p>Dr. ${accessRequest.provider.profile.firstName} ${accessRequest.provider.profile.lastName} has requested access to your medical records.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p><strong>Requested Access Duration:</strong> ${durationHours} hours</p>
          <p><strong>Requested Records:</strong> ${requestedRecords.join(', ') || 'All records'}</p>
          <br>
          <p>Please log in to your patient portal to approve or deny this request.</p>
          <a href="${process.env.CLIENT_URL}/access-requests/${accessRequest.id}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Review Request</a>
          <br><br>
          <p><em>If you did not expect this request, please contact our support team immediately.</em></p>
          `
        );
      } catch (emailError) {
        console.error('Failed to send access request email:', emailError);
      }

      // Audit log
      await auditService.log('ACCESS_REQUESTED', 'AccessRequest', {
        userId: providerId,
        userEmail: req.user.email,
        userRole: req.user.role,
        resourceId: accessRequest.id,
        description: `Requested access to patient ${patientId} for ${reason}`,
        severity: 'Info'
      });

      res.status(201).json(successResponse(
        { accessRequest },
        'Access request submitted successfully. Patient has been notified.'
      ));

    } catch (error) {
      next(error);
    }
  },

  // Patient approves access request
  approveAccess: async (req, res, next) => {
    try {
      const { requestId } = req.params;
      const patientId = req.user.id; // Assuming patient is logged in
      const { permissions = ['VIEW_RECORDS'], customDuration } = req.body;

      // Find the access request
      const accessRequest = await prisma.accessRequest.findUnique({
        where: { id: requestId },
        include: {
          patient: true,
          provider: {
            include: { profile: true }
          }
        }
      });

      if (!accessRequest) {
        return res.status(404).json(errorResponse('Access request not found'));
      }

      // Verify patient owns the request
      if (accessRequest.patientId !== patientId) {
        return res.status(403).json(errorResponse('You can only approve access requests for your own records'));
      }

      if (accessRequest.status !== 'PENDING') {
        return res.status(400).json(errorResponse('This access request has already been processed'));
      }

      // Calculate expiration
      const durationHours = customDuration || accessRequest.durationHours;
      const expiresAt = new Date(Date.now() + (durationHours * 60 * 60 * 1000));

      // Generate access token for the grant
      const accessToken = generateToken({
        patientId: accessRequest.patientId,
        providerId: accessRequest.providerId,
        grantId: requestId
      });

      // Create access grant
      const accessGrant = await prisma.accessGrant.create({
        data: {
          accessRequestId: requestId,
          patientId: accessRequest.patientId,
          providerId: accessRequest.providerId,
          grantedBy: patientId,
          expiresAt,
          permissions: {
            set: permissions
          },
          accessToken
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
                  lastName: true,
                  specialty: true
                }
              }
            }
          }
        }
      });

      // Update access request status
      await prisma.accessRequest.update({
        where: { id: requestId },
        data: { status: 'APPROVED' }
      });

      // Notify provider
      try {
        await sendEmail(
          accessRequest.provider.email,
          'Access to Medical Records Granted',
          `
          <h2>Access Granted</h2>
          <p>Dear Dr. ${accessRequest.provider.profile.firstName} ${accessRequest.provider.profile.lastName},</p>
          <p>Your request to access ${accessRequest.patient.firstName} ${accessRequest.patient.lastName}'s medical records has been approved.</p>
          <p><strong>Access Expires:</strong> ${expiresAt.toLocaleString()}</p>
          <p><strong>Granted Permissions:</strong> ${permissions.join(', ')}</p>
          <br>
          <p>You can now access the patient's records through the provider portal.</p>
          <a href="${process.env.CLIENT_URL}/patients/${accessRequest.patientId}" style="padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Access Patient Records</a>
          `
        );
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }

      // Audit log
      await auditService.log('ACCESS_APPROVED', 'AccessGrant', {
        userId: patientId,
        userEmail: req.user.email,
        userRole: req.user.role,
        resourceId: accessGrant.id,
        description: `Approved access for provider ${accessRequest.providerId} to patient ${accessRequest.patientId}`,
        severity: 'Info'
      });

      res.json(successResponse(
        { accessGrant },
        'Access request approved successfully. Provider has been notified.'
      ));

    } catch (error) {
      next(error);
    }
  },

  // Patient denies access request
  denyAccess: async (req, res, next) => {
    try {
      const { requestId } = req.params;
      const patientId = req.user.id;
      const { reason } = req.body;

      const accessRequest = await prisma.accessRequest.findUnique({
        where: { id: requestId },
        include: {
          patient: true,
          provider: {
            include: { profile: true }
          }
        }
      });

      if (!accessRequest) {
        return res.status(404).json(errorResponse('Access request not found'));
      }

      if (accessRequest.patientId !== patientId) {
        return res.status(403).json(errorResponse('You can only deny access requests for your own records'));
      }

      if (accessRequest.status !== 'PENDING') {
        return res.status(400).json(errorResponse('This access request has already been processed'));
      }

      // Update request status
      const updatedRequest = await prisma.accessRequest.update({
        where: { id: requestId },
        data: { 
          status: 'DENIED',
          notes: reason ? `Denial reason: ${reason}` : undefined
        }
      });

      // Notify provider
      try {
        await sendEmail(
          accessRequest.provider.email,
          'Access Request Denied',
          `
          <h2>Access Request Denied</h2>
          <p>Dear Dr. ${accessRequest.provider.profile.firstName} ${accessRequest.provider.profile.lastName},</p>
          <p>Your request to access ${accessRequest.patient.firstName} ${accessRequest.patient.lastName}'s medical records has been denied.</p>
          ${reason ? `<p><strong>Reason provided:</strong> ${reason}</p>` : ''}
          <br>
          <p>If you believe this is an error, please contact the patient directly or our support team.</p>
          `
        );
      } catch (emailError) {
        console.error('Failed to send denial email:', emailError);
      }

      // Audit log
      await auditService.log('ACCESS_DENIED', 'AccessRequest', {
        userId: patientId,
        userEmail: req.user.email,
        userRole: req.user.role,
        resourceId: requestId,
        description: `Denied access request from provider ${accessRequest.providerId}`,
        severity: 'Info'
      });

      res.json(successResponse(
        { accessRequest: updatedRequest },
        'Access request denied successfully.'
      ));

    } catch (error) {
      next(error);
    }
  },

  // Revoke existing access grant
  revokeAccess: async (req, res, next) => {
    try {
      const { grantId } = req.params;
      const patientId = req.user.id;

      const accessGrant = await prisma.accessGrant.findUnique({
        where: { id: grantId },
        include: {
          patient: true,
          provider: {
            include: { profile: true }
          }
        }
      });

      if (!accessGrant) {
        return res.status(404).json(errorResponse('Access grant not found'));
      }

      if (accessGrant.patientId !== patientId) {
        return res.status(403).json(errorResponse('You can only revoke access grants for your own records'));
      }

      if (accessGrant.status !== 'ACTIVE') {
        return res.status(400).json(errorResponse('This access grant is not active'));
      }

      // Revoke the grant
      const revokedGrant = await prisma.accessGrant.update({
        where: { id: grantId },
        data: { 
          status: 'REVOKED',
          expiresAt: new Date() // Set to now to immediately expire
        }
      });

      // Notify provider
      try {
        await sendEmail(
          accessGrant.provider.email,
          'Access to Medical Records Revoked',
          `
          <h2>Access Revoked</h2>
          <p>Dear Dr. ${accessGrant.provider.profile.firstName} ${accessGrant.provider.profile.lastName},</p>
          <p>Your access to ${accessGrant.patient.firstName} ${accessGrant.patient.lastName}'s medical records has been revoked.</p>
          <p><strong>Revoked At:</strong> ${new Date().toLocaleString()}</p>
          <br>
          <p>You no longer have access to this patient's records.</p>
          `
        );
      } catch (emailError) {
        console.error('Failed to send revocation email:', emailError);
      }

      // Audit log
      await auditService.log('ACCESS_REVOKED', 'AccessGrant', {
        userId: patientId,
        userEmail: req.user.email,
        userRole: req.user.role,
        resourceId: grantId,
        description: `Revoked access grant for provider ${accessGrant.providerId}`,
        severity: 'Warning'
      });

      res.json(successResponse(
        { accessGrant: revokedGrant },
        'Access grant revoked successfully.'
      ));

    } catch (error) {
      next(error);
    }
  },

  // Get patient's access requests and grants
  getPatientAccess: async (req, res, next) => {
    try {
      const patientId = req.user.id;

      const [accessRequests, accessGrants] = await Promise.all([
        // Get all access requests for this patient
        prisma.accessRequest.findMany({
          where: { patientId },
          include: {
            provider: {
              include: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                    specialty: true,
                    licenseNumber: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),

        // Get all access grants for this patient
        prisma.accessGrant.findMany({
          where: { patientId },
          include: {
            provider: {
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
            accessLogs: {
              orderBy: { accessedAt: 'desc' },
              take: 5
            }
          },
          orderBy: { grantedAt: 'desc' }
        })
      ]);

      res.json(successResponse({
        accessRequests,
        accessGrants
      }));

    } catch (error) {
      next(error);
    }
  },

  // Get provider's access requests and grants
  getProviderAccess: async (req, res, next) => {
    try {
      const providerId = req.user.id;

      const [accessRequests, accessGrants] = await Promise.all([
        // Get all access requests made by this provider
        prisma.accessRequest.findMany({
          where: { providerId },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                dateOfBirth: true,
                gender: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }),

        // Get all active access grants for this provider
        prisma.accessGrant.findMany({
          where: { 
            providerId,
            status: 'ACTIVE',
            expiresAt: { gt: new Date() }
          },
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true,
                dateOfBirth: true,
                gender: true
              }
            }
          },
          orderBy: { expiresAt: 'asc' }
        })
      ]);

      res.json(successResponse({
        accessRequests,
        accessGrants
      }));

    } catch (error) {
      next(error);
    }
  }
};

module.exports = { accessRequestController };