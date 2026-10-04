// Simple in-memory OTP store with auto-expiry (no Redis needed for launch scale)
// Map: phone -> { otp, expiresAt, attempts }
const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit

const saveOTP = (phone, otp) => {
    otpStore.set(phone, {
        otp,
        expiresAt: Date.now() + OTP_EXPIRY_MS,
        attempts: 0
    });
};

const verifyOTP = (phone, otp) => {
    const record = otpStore.get(phone);
    if (!record) return { valid: false, reason: 'OTP not found or expired. Request a new one.' };
    if (Date.now() > record.expiresAt) {
        otpStore.delete(phone);
        return { valid: false, reason: 'OTP expired. Request a new one.' };
    }
    record.attempts += 1;
    if (record.attempts > MAX_ATTEMPTS) {
        otpStore.delete(phone);
        return { valid: false, reason: 'Too many attempts. Request a new OTP.' };
    }
    if (record.otp !== otp) {
        return { valid: false, reason: `Incorrect OTP. ${MAX_ATTEMPTS - record.attempts} attempts remaining.` };
    }
    otpStore.delete(phone); // OTP is single-use
    return { valid: true };
};

module.exports = { generateOTP, saveOTP, verifyOTP };
