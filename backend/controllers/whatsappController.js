const asyncHandler = require('express-async-handler');

// @desc    Verify webhook for WhatsApp API (Meta calls this once during setup)
// @route   GET /api/whatsapp/webhook
// @access  Public
const verifyWebhook = asyncHandler(async (req, res) => {
    // This must match the token you put in the Meta App Dashboard
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'tfc_whatsapp_secret_123';
    
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('✅ WhatsApp Webhook Verified!');
            // Meta expects the challenge string back in plain text
            res.status(200).send(challenge);
        } else {
            console.error('❌ WhatsApp Webhook Verification failed: Token mismatch');
            res.status(403).json({ error: 'Verification failed' });
        }
    } else {
        res.status(400).json({ error: 'Missing parameters' });
    }
});

// @desc    Handle incoming WhatsApp webhooks (messages, statuses)
// @route   POST /api/whatsapp/webhook
// @access  Public
const handleWebhook = asyncHandler(async (req, res) => {
    const body = req.body;

    // 1. MUST return 200 OK immediately so Meta doesn't retry
    res.status(200).send('EVENT_RECEIVED');

    // 2. Process the webhook payload asynchronously
    if (body.object === 'whatsapp_business_account') {
        try {
            const entry = body.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            
            // --- A) Handle Incoming Messages ---
            if (value?.messages && value?.messages[0]) {
                const message = value.messages[0];
                const fromPhone = message.from; // Sender's phone number
                const messageType = message.type;
                
                console.log(`📩 New WhatsApp message from ${fromPhone}: type=${messageType}`);
                
                if (messageType === 'text') {
                    console.log(`💬 Message body: ${message.text.body}`);
                }
                
                // 🚀 Next step: Add auto-reply logic or trigger socket.io to admin dashboard here
            }
            
            // --- B) Handle Message Status Updates (sent, delivered, read) ---
            if (value?.statuses && value?.statuses[0]) {
                const status = value.statuses[0];
                console.log(`📬 WhatsApp message status: ${status.status} (recipient: ${status.recipient_id})`);
            }
        } catch (error) {
            console.error('❌ Error processing WhatsApp webhook:', error);
        }
    }
});

module.exports = {
    verifyWebhook,
    handleWebhook
};
