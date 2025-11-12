const express = require('express');
const { labResultController } = require('../controllers/labResultController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', labResultController.getAllLabResults);
router.get('/patient/:patientId', labResultController.getPatientLabResults);
router.get('/:id', labResultController.getLabResult);
router.post('/', authorize('Admin', 'Doctor', 'Nurse'), labResultController.createLabResult);
router.put('/:id', authorize('Admin', 'Doctor', 'Nurse'), labResultController.updateLabResult);
router.patch('/:id/status', authorize('Admin', 'Doctor', 'Nurse'), labResultController.updateLabResultStatus);
router.delete('/:id', authorize('Admin', 'Doctor'), labResultController.deleteLabResult);

module.exports = router;