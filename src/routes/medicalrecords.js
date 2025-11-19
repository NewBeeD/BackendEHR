// src/routes/medicalRecords.js
const express = require('express');
const router = express.Router();
const medicalRecordsController = require('../controllers/medicalRecordController');
const { auth, authorize, canAccessPatient } = require('../middleware/auth');

router.use(auth);

// Medical records (healthcare providers only)
// router.post('/', authorize('DOCTOR', 'NURSE'), medicalRecordsController.createMedicalRecord);
// router.get('/patient/:patientId', canAccessPatient, medicalRecordsController.getPatientMedicalRecords);


// Add to your medical records routes
router.get('/', medicalRecordsController.getAllMedicalRecords);
router.get('/patient/:patientId', medicalRecordsController.getPatientMedicalRecords);
router.get('/:id', medicalRecordsController.getMedicalRecord);
router.post('/', medicalRecordsController.createMedicalRecord);
router.put('/:id', medicalRecordsController.updateMedicalRecord);
router.delete('/:id', medicalRecordsController.deleteMedicalRecord);

module.exports = router;