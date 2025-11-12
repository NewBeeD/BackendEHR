const express = require('express');
const { medicalRecordController } = require('../controllers/medicalRecordController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', medicalRecordController.getAllMedicalRecords);
router.get('/patient/:patientId', medicalRecordController.getPatientMedicalRecords);
router.get('/:id', medicalRecordController.getMedicalRecord);
router.post('/', authorize('Admin', 'Doctor'), medicalRecordController.createMedicalRecord);
router.put('/:id', authorize('Admin', 'Doctor'), medicalRecordController.updateMedicalRecord);
router.delete('/:id', authorize('Admin', 'Doctor'), medicalRecordController.deleteMedicalRecord);

module.exports = router;