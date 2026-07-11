const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      maxlength: [500, 'Post must not exceed 500 characters'],
    },
    images: {
      type: [String],
      validate: {
        validator: (arr) => arr.length <= 4,
        message: 'Maximum 4 images per post',
      },
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    // Denormalized counters for O(1) reads
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Store who liked — array of user IDs
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index: fetch college feed sorted by newest
postSchema.index({ college: 1, createdAt: -1 });
// Text search on content + tags
postSchema.index({ content: 'text', tags: 'text' });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
