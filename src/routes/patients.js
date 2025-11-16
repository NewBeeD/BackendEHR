// src/routes/patients.js
const express = require('express');
const router = express.Router();
const patientsController = require('../controllers/patientController');
const { auth, authorize, canAccessPatient } = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Patient management (staff only)
router.post('/', authorize('DOCTOR', 'NURSE', 'ADMIN', 'RECEPTIONIST'), patientsController.createPatient);
router.get('/', authorize('DOCTOR', 'NURSE', 'ADMIN', 'RECEPTIONIST'), patientsController.getPatients);
router.get('/:id', canAccessPatient, patientsController.getPatient);
router.put('/:id', authorize('DOCTOR', 'NURSE', 'ADMIN', 'RECEPTIONIST'), patientsController.updatePatient);

module.exports = router;