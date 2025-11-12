// src/routes/accessControl.js
const express = require('express');
const { accessRequestController } = require('../controllers/accessRequestController');
const { auth, authorize } = require('../middleware/auth');
const { checkAccess } = require('../middleware/accessControl');

const router = express.Router();

// Patient-specific routes
router.get('/patient/access', auth, accessRequestController.getPatientAccess);
router.post('/patient/access-requests/:requestId/approve', auth, accessRequestController.approveAccess);
router.post('/patient/access-requests/:requestId/deny', auth, accessRequestController.denyAccess);
router.post('/patient/access-grants/:grantId/revoke', auth, accessRequestController.revokeAccess);

// Provider-specific routes
router.get('/provider/access', auth, authorize('Doctor', 'Nurse'), accessRequestController.getProviderAccess);
router.post('/patients/:patientId/request-access', auth, authorize('Doctor', 'Nurse'), accessRequestController.requestAccess);

// Emergency token-based access
router.get('/emergency-access/:patientId/:accessToken', accessRequestController.emergencyAccess);

module.exports = router;