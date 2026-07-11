const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validationResult } = require('express-validator');

const {
  getListings,
  createListing,
  getListingById,
  updateListing,
  deleteListing,
  toggleSave,
  getSavedListings,
  getMyListings,
  updateStatus,
} = require('../controllers/listing.controller');

const { protect, requireVerified } = require('../middleware/auth.middleware');
const { upload } = require('../config/cloudinary');
const { CATEGORIES, CONDITIONS } = require('../models/Listing');

// ─── Validation ───────────────────────────────────────────────────────────

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

const listingValidation = [
  body('title').trim().notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3–100 characters'),
  body('description').trim().notEmpty().withMessage('Description is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Description must be 10–1000 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('category').isIn(CATEGORIES).withMessage('Invalid category'),
  body('condition').isIn(CONDITIONS).withMessage('Invalid condition'),
];

// ─── Routes ───────────────────────────────────────────────────────────────

// All listing routes require auth
router.use(protect);

// Specific paths first (before /:id)
router.get('/saved', getSavedListings);
router.get('/my',    getMyListings);

// Browse + create
router.get('/',  getListings);
router.post('/', requireVerified, upload.array('images', 5), listingValidation, validate, createListing);

// Single listing
router.get('/:id',    getListingById);
router.patch('/:id',  requireVerified, upload.array('images', 5), updateListing);
router.delete('/:id', requireVerified, deleteListing);

// Actions
router.post('/:id/save',   toggleSave);
router.patch('/:id/status', requireVerified, updateStatus);

module.exports = router;
