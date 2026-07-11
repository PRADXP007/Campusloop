const Listing = require('../models/Listing');
const User    = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// ─── Helpers ──────────────────────────────────────────────────────────────

const buildBrowseQuery = (reqQuery, collegeId) => {
  const filter = { college: collegeId, status: 'active' };

  if (reqQuery.category && reqQuery.category !== 'All') {
    filter.category = reqQuery.category;
  }
  if (reqQuery.condition) {
    filter.condition = reqQuery.condition;
  }
  if (reqQuery.minPrice !== undefined || reqQuery.maxPrice !== undefined) {
    filter.price = {};
    if (reqQuery.minPrice !== undefined) filter.price.$gte = Number(reqQuery.minPrice);
    if (reqQuery.maxPrice !== undefined) filter.price.$lte = Number(reqQuery.maxPrice);
  }
  if (reqQuery.status && ['active', 'sold', 'paused'].includes(reqQuery.status)) {
    filter.status = reqQuery.status;
  }

  return filter;
};

const buildSort = (sortParam) => {
  switch (sortParam) {
    case 'price_asc':  return { price: 1 };
    case 'price_desc': return { price: -1 };
    case 'oldest':     return { createdAt: 1 };
    default:           return { createdAt: -1 }; // newest
  }
};

// ─── Controllers ──────────────────────────────────────────────────────────

/**
 * GET /api/v1/listings
 * Browse listings scoped to user's college, with filters and pagination
 */
const getListings = async (req, res, next) => {
  try {
    if (!req.user.college) {
      return res.status(400).json({
        success: false,
        message: 'Your profile is not associated with any college. Please update your profile or log in again.'
      });
    }

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(40, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const filter = buildBrowseQuery(req.query, req.user.college._id);
    const sort   = buildSort(req.query.sort);

    // Filter out blocked users
    const blockedUsers = req.user.blockedUsers || [];
    const usersWhoBlockedMe = await User.find({ blockedUsers: req.user._id }).select('_id');
    const blockedMeIds = usersWhoBlockedMe.map((u) => u._id);
    const allBlockedIds = [...blockedUsers, ...blockedMeIds];

    if (allBlockedIds.length > 0) {
      filter.seller = { $nin: allBlockedIds };
    }

    // Filter by verified sellers only if requested
    if (req.query.verifiedSellers === 'true') {
      const verifiedUsers = await User.find({ isVerified: true, verificationStatus: 'verified' }).select('_id');
      const verifiedIds = verifiedUsers.map((u) => u._id);
      if (filter.seller) {
        filter.seller = { $and: [filter.seller, { $in: verifiedIds }] };
      } else {
        filter.seller = { $in: verifiedIds };
      }
    }

    // Full-text search
    if (req.query.q && req.query.q.trim()) {
      filter.$text = { $search: req.query.q.trim() };
    }

    const [listings, total] = await Promise.all([
      Listing.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('seller', 'name avatar college isVerified verificationStatus isSuspicious')
        .lean(),
      Listing.countDocuments(filter),
    ]);

    res.json({
      success: true,
      listings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/listings
 * Create a new listing (multipart/form-data with images)
 */
const createListing = async (req, res, next) => {
  try {
    if (!req.user.college) {
      return res.status(400).json({
        success: false,
        message: 'Your profile is not associated with any college. Please update your profile.'
      });
    }

    const { title, description, price, priceNegotiable, category, condition } = req.body;

    // Collect uploaded image URLs from multer-cloudinary
    const images = (req.files || []).map((f) => f.path);

    const listing = await Listing.create({
      seller:          req.user._id,
      college:         req.user.college._id,
      title,
      description,
      price:           Number(price),
      priceNegotiable: priceNegotiable === 'true' || priceNegotiable === true,
      category,
      condition,
      images,
    });

    await listing.populate('seller', 'name avatar college isVerified verificationStatus isSuspicious');

    res.status(201).json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/listings/:id
 * Get a single listing and increment views
 */
const getListingById = async (req, res, next) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('seller', 'name avatar college department year createdAt isVerified verificationStatus isSuspicious')
      .populate('college', 'name shortName city');

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    // Check if current user has saved it
    const isSaved = listing.savedBy.includes(req.user._id);

    res.json({ success: true, listing, isSaved });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/listings/:id
 * Update listing fields (seller only)
 */
const updateListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this listing.' });
    }

    const allowed = ['title', 'description', 'price', 'priceNegotiable', 'category', 'condition', 'status'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) listing[field] = req.body[field];
    });

    // Handle new image uploads (append, keep existing unless client sends removeImages)
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map((f) => f.path);
      listing.images = [...listing.images, ...newImages].slice(0, 5);
    }

    // Handle image removals sent as JSON array of URLs
    if (req.body.removeImages) {
      const toRemove = JSON.parse(req.body.removeImages);
      // Delete from Cloudinary
      for (const url of toRemove) {
        const parts = url.split('/');
        const publicIdWithExt = parts.slice(-2).join('/');
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
        try { await cloudinary.uploader.destroy(publicId); } catch {}
      }
      listing.images = listing.images.filter((img) => !toRemove.includes(img));
    }

    await listing.save();
    await listing.populate('seller', 'name avatar college isVerified verificationStatus isSuspicious');

    res.json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/listings/:id
 * Hard delete listing + Cloudinary images (seller only)
 */
const deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }
    if (listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this listing.' });
    }

    // Remove images from Cloudinary
    for (const url of listing.images) {
      const parts = url.split('/');
      const publicIdWithExt = parts.slice(-2).join('/');
      const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');
      try { await cloudinary.uploader.destroy(publicId); } catch {}
    }

    await listing.deleteOne();
    res.json({ success: true, message: 'Listing deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/listings/:id/save
 * Toggle save/unsave a listing
 */
const toggleSave = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found.' });
    }

    const userId = req.user._id;
    const alreadySaved = listing.savedBy.includes(userId);

    if (alreadySaved) {
      listing.savedBy.pull(userId);
    } else {
      listing.savedBy.push(userId);
    }
    await listing.save();

    res.json({ success: true, isSaved: !alreadySaved, savedCount: listing.savedBy.length });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/listings/saved
 * Get all listings saved by the current user
 */
const getSavedListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ savedBy: req.user._id, status: 'active' })
      .sort({ createdAt: -1 })
      .populate('seller', 'name avatar isVerified verificationStatus isSuspicious')
      .lean();

    res.json({ success: true, listings });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/listings/my
 * Get listings posted by the current user (all statuses)
 */
const getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ seller: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, listings });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/listings/:id/status
 * Quick status change — mark sold, pause, reactivate
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['active', 'sold', 'paused'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const listing = await Listing.findOneAndUpdate(
      { _id: req.params.id, seller: req.user._id },
      { status },
      { new: true }
    );

    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found or not yours.' });
    }

    res.json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getListings,
  createListing,
  getListingById,
  updateListing,
  deleteListing,
  toggleSave,
  getSavedListings,
  getMyListings,
  updateStatus,
};
