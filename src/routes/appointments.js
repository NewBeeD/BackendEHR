const express = require('express');
const { appointmentController } = require('../controllers/appointmentController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', appointmentController.getAllAppointments);
router.get('/today', appointmentController.getTodayAppointments);
router.get('/doctor/:doctorId', appointmentController.getDoctorAppointments);
router.get('/:id', appointmentController.getAppointment);
router.post('/', authorize('Admin', 'Doctor', 'Receptionist'), appointmentController.createAppointment);
router.put('/:id', authorize('Admin', 'Doctor', 'Receptionist'), appointmentController.updateAppointment);
router.delete('/:id', authorize('Admin', 'Doctor'), appointmentController.deleteAppointment);

module.exports = router;