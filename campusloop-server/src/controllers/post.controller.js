const Post    = require('../models/Post');
const Comment = require('../models/Comment');
const User    = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// ─── Posts ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/posts
 * Paginated college feed using cursor-based pagination via `before` timestamp.
 * Falls back to offset for first load.
 */
const getFeed = async (req, res, next) => {
  try {
    if (!req.user.college) {
      return res.status(400).json({
        success: false,
        message: 'Your profile is not associated with any college. Please update your profile or log in again.'
      });
    }

    const limit  = Math.min(20, parseInt(req.query.limit) || 10);
    const before = req.query.before; // ISO timestamp cursor

    // Fetch users who blocked this user or are blocked by this user
    const blockedUsers = req.user.blockedUsers || [];
    const usersWhoBlockedMe = await User.find({ blockedUsers: req.user._id }).select('_id');
    const blockedMeIds = usersWhoBlockedMe.map((u) => u._id);
    const allBlockedIds = [...blockedUsers, ...blockedMeIds];

    const filter = { 
      college: req.user.college._id,
      author: { $nin: allBlockedIds }
    };
    // Optional: filter by a specific author (for profile page)
    if (req.query.author) {
      filter.author = req.query.author;
    }
    if (before) {
      filter.createdAt = { $lt: new Date(before) };
    }

    const posts = await Post.find(filter)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit + 1) // fetch one extra to detect hasMore
      .populate('author', 'name avatar department year isVerified verificationStatus isSuspicious')
      .lean();

    const hasMore     = posts.length > limit;
    const resultPosts = hasMore ? posts.slice(0, limit) : posts;

    // Mark which posts the current user has liked
    const userId = req.user._id.toString();
    const enriched = resultPosts.map((p) => ({
      ...p,
      isLiked: p.likes.map((id) => id.toString()).includes(userId),
      likes: undefined, // don't send full likes array to client
    }));

    const nextCursor = hasMore
      ? resultPosts[resultPosts.length - 1].createdAt.toISOString()
      : null;

    res.json({ success: true, posts: enriched, hasMore, nextCursor });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/posts
 * Create a new post with optional images
 */
const createPost = async (req, res, next) => {
  try {
    const { content, tags } = req.body;

    const images = (req.files || []).map((f) => f.path);

    // Parse tags — can arrive as comma-separated string or JSON array
    let parsedTags = [];
    if (tags) {
      try {
        parsedTags = JSON.parse(tags);
      } catch {
        parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    // Extract inline hashtags from content too
    const hashtagMatches = content.match(/#(\w+)/g) || [];
    const inlineTags = hashtagMatches.map((t) => t.slice(1).toLowerCase());
    const allTags = [...new Set([...parsedTags, ...inlineTags])];

    if (!req.user.college) {
      return res.status(400).json({
        success: false,
        message: 'Your profile is not associated with any college. Please update your profile.'
      });
    }

    const post = await Post.create({
      author:  req.user._id,
      college: req.user.college._id,
      content,
      images,
      tags: allTags,
    });

    await post.populate('author', 'name avatar department year');

    res.status(201).json({
      success: true,
      post: { ...post.toObject(), isLiked: false },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/posts/:id
 * Get a single post with comments count
 */
const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar department year isVerified verificationStatus isSuspicious')
      .lean();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const userId  = req.user._id.toString();
    const isLiked = post.likes.map((id) => id.toString()).includes(userId);

    res.json({
      success: true,
      post: { ...post, isLiked, likes: undefined },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/posts/:id
 * Delete a post and all its comments (author only)
 */
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this post.' });
    }

    // Delete images from Cloudinary
    for (const url of post.images) {
      const parts         = url.split('/');
      const publicIdRaw   = parts.slice(-2).join('/');
      const publicId      = publicIdRaw.replace(/\.[^/.]+$/, '');
      try { await cloudinary.uploader.destroy(publicId); } catch {}
    }

    await Comment.deleteMany({ post: post._id });
    await post.deleteOne();

    res.json({ success: true, message: 'Post deleted.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/posts/:id/like
 * Toggle like on a post
 */
const toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const userId    = req.user._id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes.pull(userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likes.push(userId);
      post.likesCount += 1;
    }

    await post.save();

    res.json({
      success:    true,
      isLiked:    !alreadyLiked,
      likesCount: post.likesCount,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Comments ─────────────────────────────────────────────────────────────

/**
 * GET /api/v1/posts/:id/comments
 * Fetch all comments for a post (flat, sorted oldest first)
 */
const getComments = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip  = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ post: req.params.id, parentComment: null })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar department year isVerified verificationStatus isSuspicious')
        .lean(),
      Comment.countDocuments({ post: req.params.id, parentComment: null }),
    ]);

    res.json({
      success: true,
      comments,
      hasMore: skip + limit < total,
      total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/posts/:id/comments
 * Add a comment to a post
 */
const addComment = async (req, res, next) => {
  try {
    const { content, parentComment } = req.body;

    // Verify post exists
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found.' });
    }

    const comment = await Comment.create({
      post:          post._id,
      author:        req.user._id,
      content,
      parentComment: parentComment || null,
    });

    // Increment denormalized counter on post
    await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } });

    await comment.populate('author', 'name avatar department year isVerified verificationStatus isSuspicious');

    res.status(201).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/posts/:id/comments/:commentId
 * Delete a comment (author only)
 */
const deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found.' });
    }
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await comment.deleteOne();
    await Post.findByIdAndUpdate(req.params.id, { $inc: { commentsCount: -1 } });

    res.json({ success: true, message: 'Comment deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFeed,
  createPost,
  getPostById,
  deletePost,
  toggleLike,
  getComments,
  addComment,
  deleteComment,
};
