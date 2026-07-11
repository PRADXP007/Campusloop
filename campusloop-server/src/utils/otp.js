/**
 * Generate a random 6-digit OTP and compute its expiry (10 minutes)
 */
const generateOTP = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return { code, expiresAt };
};

module.exports = { generateOTP };
