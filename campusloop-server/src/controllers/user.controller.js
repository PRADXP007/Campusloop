const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

/**
 * GET /api/v1/users/me
 * Returns the authenticated user's full profile
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is already populated from auth middleware with college populated
    res.json({ success: true, user: req.user });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/users/me
 * Update name, bio, department, year, phone
 */
const updateMe = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'bio', 'department', 'year', 'phone', 'avatar'];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).populate({
      path: 'college',
      populate: [
        { path: 'state', select: 'name' },
        { path: 'district', select: 'name' },
      ],
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/users/me/avatar
 * Upload or replace profile photo via Cloudinary
 */
const uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ success: false, message: 'No image file provided.' });
    }

    const avatarUrl = req.file.path; // Cloudinary secure URL

    // If user already has a custom avatar on Cloudinary, delete the old one
    const existingUser = await User.findById(req.user._id);
    if (existingUser?.avatar && existingUser.avatar.includes('cloudinary.com')) {
      try {
        // Extract public_id from URL  (campusloop/avatars/<id>)
        const urlParts = existingUser.avatar.split('/');
        const publicId = urlParts.slice(-2).join('/').replace(/\.[^/.]+$/, '');
        await cloudinary.uploader.destroy(publicId);
      } catch {
        // Non-fatal — continue even if old image deletion fails
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true, runValidators: true }
    ).populate({
      path: 'college',
      populate: [
        { path: 'state', select: 'name' },
        { path: 'district', select: 'name' },
      ],
    });

    res.json({ success: true, message: 'Profile photo updated successfully.', user });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/users/:id
 * Get another user's public profile
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate({
      path: 'college',
      populate: [
        { path: 'state', select: 'name' },
        { path: 'district', select: 'name' },
      ],
    });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/users/me/verification
 * Upload student ID card and selfie
 */
const verifyStudent = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let idCardPath = '';
    let selfiePath = '';

    // Handle files uploaded to Cloudinary/multer
    if (req.files) {
      if (req.files.idCard) {
        idCardPath = req.files.idCard[0].path;
      }
      if (req.files.selfie) {
        selfiePath = req.files.selfie[0].path;
      }
    }

    // Support mock fallbacks if Cloudinary keys are missing (prevents blockages in local dev test)
    if (!idCardPath && req.body.idCardUrl) {
      idCardPath = req.body.idCardUrl;
    }
    if (!selfiePath && req.body.selfieUrl) {
      selfiePath = req.body.selfieUrl;
    }

    if (idCardPath) {
      user.idCardImage = idCardPath;
    }
    if (selfiePath) {
      user.selfieImage = selfiePath;
    }

    // A student becomes fully verified only if they have verified college email AND uploaded ID card AND uploaded selfie
    const hasEmailVerified = user.isEmailVerified;
    const hasIdCard = !!user.idCardImage;
    const hasSelfie = !!user.selfieImage;

    if (hasEmailVerified && hasIdCard && hasSelfie) {
      user.verificationStatus = 'verified';
      user.isVerified = true;
      user.verifiedAt = new Date();
    } else {
      user.verificationStatus = 'pending';
    }

    await user.save();
    await user.populate({
      path: 'college',
      populate: [
        { path: 'state', select: 'name' },
        { path: 'district', select: 'name' },
      ],
    });

    res.json({
      success: true,
      message: user.verificationStatus === 'verified'
        ? 'Congratulations! You are now a verified student.'
        : 'Documents uploaded. Verification status: pending.',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/users/:id/block
 * Add user ID to blocked list
 */
const blockUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot block yourself.' });
    }

    const user = await User.findById(req.user._id);
    if (!user.blockedUsers.includes(targetId)) {
      user.blockedUsers.push(targetId);
      await user.save();
    }

    res.json({ success: true, message: 'User blocked successfully.', blockedUsers: user.blockedUsers });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/users/:id/unblock
 * Remove user ID from blocked list
 */
const unblockUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const user = await User.findById(req.user._id);
    user.blockedUsers.pull(targetId);
    await user.save();

    res.json({ success: true, message: 'User unblocked successfully.', blockedUsers: user.blockedUsers });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/users/:id/report
 * Report a user for suspicious activity
 */
const reportUser = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const { reason } = req.body;

    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    targetUser.reportsCount += 1;

    // Warning system: if user is reported 3 or more times, flag them as suspicious
    if (targetUser.reportsCount >= 3) {
      targetUser.isSuspicious = true;
      targetUser.suspiciousReason = reason || 'Multiple user reports for suspicious behavior.';
    }

    await targetUser.save();

    res.json({
      success: true,
      message: 'User reported successfully. Thank you for keeping CampusLoop safe.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMe, updateMe, uploadAvatar, getUserById, verifyStudent, blockUser, unblockUser, reportUser };
