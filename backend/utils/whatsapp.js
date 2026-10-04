const axios = require('axios');

const sendWhatsAppMessage = async (to, messageBody) => {
    try {
        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_ID;

        if (!token || !phoneId) {
            console.warn('⚠️ WhatsApp credentials missing. Skipping message send.');
            return;
        }

        // Format the phone number (remove +, spaces, etc.)
        const cleanPhone = to.replace(/\D/g, '');

        const payload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanPhone,
            type: 'text',
            text: {
                preview_url: false,
                body: messageBody
            }
        };

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

        console.log(`✅ WhatsApp message sent to ${cleanPhone}`);
        return response.data;
    } catch (error) {
        console.error('❌ Failed to send WhatsApp message:', error.response?.data || error.message);
    }
};

module.exports = {
    sendWhatsAppMessage
};
