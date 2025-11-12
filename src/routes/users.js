const express = require('express');
const { userController } = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', authorize('Admin'), userController.getAllUsers);
router.get('/doctors', userController.getDoctors);
router.get('/:id', userController.getUser);
router.get('/:id/stats', userController.getUserStats);
router.put('/:id', authorize('Admin'), userController.updateUser);
router.patch('/:id/profile', userController.updateProfile);
router.delete('/:id', authorize('Admin'), userController.deleteUser);

module.exports = router;