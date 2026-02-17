const express = require('express');
const router = express.Router();
const { getNearbyStore, getStoreById } = require('../controllers/storeController');
const { validateStoreNearby, validateMongoId } = require('../middleware/validation');

router.get('/nearby', validateStoreNearby, getNearbyStore);
router.get('/:id', validateMongoId, getStoreById);

module.exports = router;
