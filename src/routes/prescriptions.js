const express = require('express');
const { prescriptionController } = require('../controllers/prescriptionController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', prescriptionController.getAllPrescriptions);
router.get('/patient/:patientId', prescriptionController.getPatientPrescriptions);
router.get('/:id', prescriptionController.getPrescription);
router.post('/', authorize('Admin', 'Doctor'), prescriptionController.createPrescription);
router.put('/:id', authorize('Admin', 'Doctor'), prescriptionController.updatePrescription);
router.patch('/:id/status', authorize('Admin', 'Doctor', 'Nurse'), prescriptionController.updatePrescriptionStatus);
router.delete('/:id', authorize('Admin', 'Doctor'), prescriptionController.deletePrescription);

module.exports = router;