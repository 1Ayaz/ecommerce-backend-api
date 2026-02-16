const express = require('express');
const router = express.Router();
const { getNearbyStore, getStoreById } = require('../controllers/storeController');

router.get('/nearby', getNearbyStore);
router.get('/:id', getStoreById);

module.exports = router;
