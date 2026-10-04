const express = require('express');
const router = express.Router();
const { verifyWebhook, handleWebhook } = require('../controllers/whatsappController');

// Standard Meta webhook endpoints
router.route('/webhook')
    .get(verifyWebhook)   // Meta calls GET to verify the token
    .post(handleWebhook); // Meta calls POST to send new messages

module.exports = router;
