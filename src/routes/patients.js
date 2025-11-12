// // src/routes/patients.js
// const express = require('express');
// const { patientController } = require('../controllers/patientController');
// const { auth, authorize } = require('../middleware/auth');

// const router = express.Router();

// router.use(auth);

// router.get('/', patientController.getAllPatients);
// router.get('/:id', patientController.getPatient);
// router.post('/', authorize('Admin', 'Doctor', 'Receptionist'), patientController.createPatient);
// router.put('/:id', authorize('Admin', 'Doctor', 'Receptionist'), patientController.updatePatient);
// router.delete('/:id', authorize('Admin'), patientController.deletePatient);
// router.get('/:id/medical-history', patientController.getMedicalHistory);
// router.get('/:id/appointments', patientController.getPatientAppointments);

// module.exports = router;



// src/routes/patients.js
const express = require('express');
const { patientController } = require('../controllers/patientController');
const { auth, authorize } = require('../middleware/auth');
const { checkAccess } = require('../middleware/accessControl');

const router = express.Router();

router.use(auth);

// Routes that require specific access permissions
router.get('/:id', checkAccess(['VIEW_RECORDS']), patientController.getPatient);
router.get('/:id/medical-history', checkAccess(['VIEW_RECORDS']), patientController.getMedicalHistory);
router.get('/:id/appointments', checkAccess(['VIEW_RECORDS']), patientController.getPatientAppointments);
router.get('/:id/prescriptions', checkAccess(['VIEW_PRESCRIPTIONS']), patientController.getPatientPrescriptions);
router.get('/:id/lab-results', checkAccess(['VIEW_LAB_RESULTS']), patientController.getPatientLabResults);

// Admin/primary provider only routes
router.post('/', authorize('Admin', 'Doctor', 'Receptionist'), patientController.createPatient);
router.put('/:id', authorize('Admin', 'Doctor', 'Receptionist'), patientController.updatePatient);
router.delete('/:id', authorize('Admin'), patientController.deletePatient);

module.exports = router;