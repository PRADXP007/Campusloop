const express = require('express');
const router = express.Router();
const { getMe, updateMe, uploadAvatar, getUserById, verifyStudent, blockUser, unblockUser, reportUser } = require('../controllers/user.controller');
const { protect, requireVerified } = require('../middleware/auth.middleware');
const { upload, avatarUpload } = require('../config/cloudinary');

router.use(protect); // All user routes require auth

router.get('/me', getMe);
router.patch('/me', requireVerified, updateMe);

// Profile photo upload
router.post('/me/avatar', avatarUpload.single('avatar'), uploadAvatar);

// Student identity verification (Step 4 & 5)
router.post('/me/verification', upload.fields([
  { name: 'idCard', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]), verifyStudent);

// Moderation / Scammer prevention
router.post('/:id/block', blockUser);
router.post('/:id/unblock', unblockUser);
router.post('/:id/report', reportUser);
router.get('/:id', getUserById);

module.exports = router;
