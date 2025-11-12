const express = require('express');
const { billingController } = require('../controllers/billingController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', billingController.getAllBilling);
router.get('/summary', billingController.getBillingSummary);
router.get('/patient/:patientId', billingController.getPatientBilling);
router.get('/:id', billingController.getBilling);
router.post('/', authorize('Admin', 'Doctor', 'Receptionist'), billingController.createBilling);
router.put('/:id', authorize('Admin', 'Doctor', 'Receptionist'), billingController.updateBilling);
router.patch('/:id/payment-status', authorize('Admin', 'Receptionist'), billingController.updatePaymentStatus);
router.delete('/:id', authorize('Admin'), billingController.deleteBilling);

module.exports = router;