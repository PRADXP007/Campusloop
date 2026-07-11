const express  = require('express');
const router   = express.Router();
const { body, validationResult } = require('express-validator');
const multer   = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');

const {
  getFeed,
  createPost,
  getPostById,
  deletePost,
  toggleLike,
  getComments,
  addComment,
  deleteComment,
} = require('../controllers/post.controller');

const { protect, requireVerified } = require('../middleware/auth.middleware');

// ─── Post-specific Cloudinary storage ─────────────────────────────────────
// Separate folder from listings
const postStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'campusloop/posts',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1080, height: 1080, crop: 'limit', quality: 'auto:good' }],
  },
});

const postUpload = multer({
  storage: postStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
  },
});

// ─── Validation helpers ───────────────────────────────────────────────────

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors:  errors.array(),
    });
  }
  next();
};

const postValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Post content is required')
    .isLength({ max: 500 }).withMessage('Post must not exceed 500 characters'),
];

const commentValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment cannot be empty')
    .isLength({ max: 300 }).withMessage('Comment must not exceed 300 characters'),
];

// ─── Routes ───────────────────────────────────────────────────────────────

// All routes require auth
router.use(protect);

// Feed
router.get('/',    getFeed);
router.post('/',   requireVerified, postUpload.array('images', 4), postValidation, validate, createPost);
router.get('/:id', getPostById);
router.delete('/:id', requireVerified, deletePost);

// Like
router.post('/:id/like', toggleLike);

// Comments
router.get('/:id/comments',    getComments);
router.post('/:id/comments',   requireVerified, commentValidation, validate, addComment);
router.delete('/:id/comments/:commentId', requireVerified, deleteComment);

module.exports = router;
