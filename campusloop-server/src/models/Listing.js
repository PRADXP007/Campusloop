const mongoose = require('mongoose');

const CATEGORIES = [
  'Books & Notes',
  'Electronics',
  'Furniture',
  'Clothing',
  'Sports',
  'Hostel Essentials',
  'Bicycles',
  'Other',
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

const listingSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
      index: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title must not exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description must not exceed 1000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    priceNegotiable: {
      type: Boolean,
      default: false,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: { values: CATEGORIES, message: 'Invalid category' },
    },
    condition: {
      type: String,
      required: [true, 'Condition is required'],
      enum: { values: CONDITIONS, message: 'Invalid condition' },
    },
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: 'Maximum 5 images allowed',
      },
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'sold', 'paused'],
      default: 'active',
      index: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    savedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// Compound index for the main browse query (college + status + category)
listingSchema.index({ college: 1, status: 1, category: 1 });
listingSchema.index({ college: 1, status: 1, createdAt: -1 });

// Full-text search index
listingSchema.index({ title: 'text', description: 'text' });

// Price index for sorting
listingSchema.index({ price: 1 });

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;
module.exports.CATEGORIES = CATEGORIES;
module.exports.CONDITIONS = CONDITIONS;
