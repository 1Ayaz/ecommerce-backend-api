/**
 * Run this once to register your WhatsApp phone number via the API.
 * Usage: node register_phone.js
 */

const axios = require('axios');

// ── FILL THESE IN ──────────────────────────────────────────────────────────
const PHONE_NUMBER_ID  = 'PASTE_YOUR_PHONE_NUMBER_ID_HERE';   // 15-digit number from Meta API Setup
const ACCESS_TOKEN     = 'PASTE_YOUR_WHATSAPP_ACCESS_TOKEN_HERE'; // Long EAA... token
const PIN              = '123456';  // Set any 6-digit 2FA PIN you want for this number
// ───────────────────────────────────────────────────────────────────────────

const registerPhone = async () => {
    console.log('🔄 Registering WhatsApp phone number...');
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/register`,
            {
                messaging_product: 'whatsapp',
                pin: PIN,
            },
            {
                headers: {
                    'Authorization': `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                }
            }
        );

        console.log('\n✅ SUCCESS! Phone number registered!');
        console.log('   Your number status will change to "Connected" in Meta within 30 seconds.');
        console.log('   Response:', JSON.stringify(response.data, null, 2));
        process.exit(0);
    } catch (error) {
        const errData = error.response?.data?.error;
        console.error('\n❌ Registration failed!');
        if (errData) {
            console.error(`   Code: ${errData.code}`);
            console.error(`   Message: ${errData.message}`);
            console.error(`   Sub-code: ${errData.error_subcode}`);
        } else {
            console.error('   Error:', error.message);
        }
        process.exit(1);
    }
};

registerPhone();
