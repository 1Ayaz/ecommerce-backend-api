const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    updateUserProfile,
    saveFcmToken,
    addAddress,
    getAddresses,
    updateAddress,
    deleteAddress,
    getUsers,
} = require('../controllers/userController');
const { subscribeUser } = require('../controllers/pushController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/subscribe', protect, subscribeUser);
router.post('/fcm-token', protect, saveFcmToken);

router.get('/all', protect, authorize('admin'), getUsers);

router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

router.route('/addresses')
    .post(protect, addAddress)
    .get(protect, getAddresses);

router.route('/addresses/:id')
    .put(protect, updateAddress)
    .delete(protect, deleteAddress);

module.exports = router;
