const User = require('../models/User');
const College = require('../models/College');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { generateOTP } = require('../utils/otp');
const { sendOTPEmail } = require('../services/email.service');

// ─── Helper ────────────────────────────────────────────────────────────────

/**
 * Issue both tokens and set refresh token cookie + in DB
 */
const issueTokens = async (user, res) => {
  const payload = { id: user._id, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Persist refresh token (hashed storage can be added later)
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // httpOnly cookie for refresh token (not accessible from JS)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
  });

  return accessToken;
};

// ─── Controllers ───────────────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Body: { name, email, password, collegeId }
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, collegeId, department, year } = req.body;

    // Validate college exists
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(400).json({ success: false, message: 'Selected college not found.' });
    }

    // Check duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Generate OTP
    const { code, expiresAt } = generateOTP();

    // Create user (password is stored in passwordHash field; pre-save hook hashes it)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: password,
      college: collegeId,
      department: department || '',
      year: year || '',
      otp: { code, expiresAt },
      isVerified: false,
      isEmailVerified: false,
    });

    // Send OTP email (non-blocking — don't fail registration if email fails)
    let emailSent = true;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEVELOPMENT] Generated OTP for user ${user.email} is: ${code}`);
    }
    try {
      await sendOTPEmail(user.email, user.name, code);
    } catch (emailErr) {
      console.warn('OTP email failed (continuing):', emailErr.message);
      emailSent = false;
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? 'Account created. Please verify your email with the OTP sent.'
        : (process.env.NODE_ENV === 'development'
            ? `Account created. Verification email failed, but dev OTP is: ${code}`
            : 'Account created. However, the verification email could not be sent. Please request a new OTP on the verification page.'),
      emailSent,
      userId: user._id,
      devOtp: process.env.NODE_ENV === 'development' ? code : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/verify-otp
 * Body: { userId, otp }
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId).select('+otp.code +otp.expiresAt');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.isEmailVerified) {
      if (process.env.NODE_ENV === 'development') {
        const accessToken = await issueTokens(user, res);
        await user.populate({
          path: 'college',
          populate: [
            { path: 'state', select: 'name' },
            { path: 'district', select: 'name' },
          ],
        });
        return res.json({
          success: true,
          message: 'Email verified successfully!',
          accessToken,
          user: user.toJSON(),
        });
      }
      return res.status(400).json({ success: false, message: 'Email already verified.' });
    }

    if (!user.otp?.code || user.otp.code !== otp) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEVELOPMENT] Bypassing OTP check. Expected: ${user.otp?.code}, Received: ${otp}`);
      } else {
        return res.status(400).json({ success: false, message: 'Invalid OTP.' });
      }
    }

    if (new Date() > user.otp.expiresAt && process.env.NODE_ENV !== 'development') {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    await user.save({ validateBeforeSave: false });

    const accessToken = await issueTokens(user, res);
    await user.populate({
      path: 'college',
      populate: [
        { path: 'state', select: 'name' },
        { path: 'district', select: 'name' },
      ],
    });

    res.json({
      success: true,
      message: 'Email verified successfully!',
      accessToken,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/resend-otp
 * Body: { userId }
 */
const resendOTP = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const user = await User.findById(userId).select('+otp');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified.' });
    }

    // Rate-limit: last OTP must be > 1 minute old
    if (user.otp?.expiresAt && new Date(user.otp.expiresAt) > new Date(Date.now() + 9 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting a new OTP.',
      });
    }

    const { code, expiresAt } = generateOTP();
    user.otp = { code, expiresAt };
    await user.save({ validateBeforeSave: false });

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEVELOPMENT] Generated OTP for user ${user.email} is: ${code}`);
    }

    try {
      await sendOTPEmail(user.email, user.name, code);
      res.json({ success: true, message: 'A new OTP has been sent to your email.' });
    } catch (emailErr) {
      console.error('OTP email failed:', emailErr.message);
      if (process.env.NODE_ENV === 'development') {
        console.warn(`[DEVELOPMENT] Continuing in dev mode. OTP is: ${code}`);
        return res.json({
          success: true,
          message: `[DEV MODE] SMTP email failed, but OTP generated: ${code}. You can enter this code to verify.`,
          devOtp: code,
        });
      }
      res.status(500).json({
        success: false,
        message: `Failed to deliver OTP email: ${emailErr.message}. Please check your email configuration.`
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(`[LOGIN TRY] Email: "${email}", Password: "${password}", Length: ${password?.length}`);

    // Include passwordHash in query (excluded by default via `select: false`)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      console.log(`[LOGIN FAIL] User not found for email: "${email.toLowerCase()}"`);
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    console.log(`[LOGIN COMPARE] Match result: ${isMatch}`);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const accessToken = await issueTokens(user, res);
    await user.populate({
      path: 'college',
      populate: [
        { path: 'state', select: 'name' },
        { path: 'district', select: 'name' },
      ],
    });

    res.json({
      success: true,
      accessToken,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh
 * Reads refresh token from httpOnly cookie
 */
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token provided.' });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const accessToken = await issueTokens(user, res);

    res.json({ success: true, accessToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    next(error);
  }
};

/**
 * POST /api/v1/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    req.user.refreshToken = undefined;
    await req.user.save({ validateBeforeSave: false });

    res.clearCookie('refreshToken');
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/test-email
 * Body: { to }
 */
const testEmail = async (req, res, next) => {
  try {
    const { to } = req.body;
    const testTo = to || process.env.SMTP_USER;
    
    if (!testTo) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email is required (pass in body { "to": "..." }) or set SMTP_USER in .env.',
      });
    }

    console.log(`[EmailService] Sending test verification email to: ${testTo}`);
    const code = '123456';
    await sendOTPEmail(testTo, 'Test User', code);

    res.json({
      success: true,
      message: `Test verification email successfully delivered to ${testTo}!`,
    });
  } catch (error) {
    console.error('❌ [EmailService] Test email delivery failed:', error);
    res.status(500).json({
      success: false,
      message: `Email delivery failed: ${error.message}`,
    });
  }
};

module.exports = { register, verifyOTP, resendOTP, login, refresh, logout, testEmail };
