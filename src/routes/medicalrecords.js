// src/routes/medicalRecords.js
const express = require('express');
const router = express.Router();
const medicalRecordsController = require('../controllers/medicalRecordController');
const { auth, authorize, canAccessPatient } = require('../middleware/auth');

router.use(auth);

// Medical records (healthcare providers only)
router.post('/', authorize('DOCTOR', 'NURSE'), medicalRecordsController.createMedicalRecord);
router.get('/patient/:patientId', canAccessPatient, medicalRecordsController.getPatientMedicalRecords);

module.exports = router;