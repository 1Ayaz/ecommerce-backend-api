const axios = require('axios');

// ── Helper: base API call ────────────────────────────────────────────────────
const callWhatsAppAPI = async (phoneId, token, payload) => {
    const response = await axios.post(
        `https://graph.facebook.com/v18.0/${phoneId}/messages`,
        payload,
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }
    );
    return response.data;
};

// ── Send OTP via Authentication Template ─────────────────────────────────────
// Uses the approved "freshcuts_otp" Meta authentication template.
// This bypasses the 24-hour messaging window restriction.
const sendOTPMessage = async (to, otpCode) => {
    try {
        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_ID;

        if (!token || !phoneId) {
            console.warn('⚠️ WhatsApp credentials missing. Skipping OTP send.');
            return;
        }

        const cleanPhone = to.replace(/\D/g, '');

        // Authentication template payload — Meta requires this specific format
        // The "freshcuts_otp" template has 1 body param (the OTP) and 1 button param (copy code)
        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'template',
            template: {
                name: 'freshcuts_otp',
                language: { code: 'en_US' },
                components: [
                    {
                        type: 'body',
                        parameters: [{ type: 'text', text: otpCode }]
                    },
                    {
                        // The "Copy code" button on authentication templates
                        type: 'button',
                        sub_type: 'url',
                        index: '0',
                        parameters: [{ type: 'text', text: otpCode }]
                    }
                ]
            }
        };

        const result = await callWhatsAppAPI(phoneId, token, payload);
        console.log(`✅ WhatsApp OTP sent to ${cleanPhone}`);
        return result;
    } catch (error) {
        console.error('❌ Failed to send WhatsApp OTP:', error.response?.data || error.message);
        throw error; // Re-throw so AuthService can catch it and return proper error to user
    }
};

// ── Send generic free-form text message ──────────────────────────────────────
// Only works if the recipient messaged your number within the last 24 hours.
// Used for order updates / admin notifications.
const sendWhatsAppMessage = async (to, messageBody) => {
    try {
        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_ID;

        if (!token || !phoneId) {
            console.warn('⚠️ WhatsApp credentials missing. Skipping message send.');
            return;
        }

        const cleanPhone = to.replace(/\D/g, '');

        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: { preview_url: false, body: messageBody }
        };

        const result = await callWhatsAppAPI(phoneId, token, payload);
        console.log(`✅ WhatsApp message sent to ${cleanPhone}`);
        return result;
    } catch (error) {
        console.error('❌ Failed to send WhatsApp message:', error.response?.data || error.message);
    }
};

module.exports = {
    sendWhatsAppMessage,
    sendOTPMessage,
};
