const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Start or retrieve a conversation with a specific user
// @route   POST /api/v1/chat/conversations
// @access  Private
exports.startOrCreateConversation = async (req, res, next) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ success: false, message: 'Participant ID is required' });
    }

    if (participantId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot start a conversation with yourself' });
    }

    // Check if user exists
    const recipient = await User.findById(participantId);
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if blocked
    const hasBlocked = req.user.blockedUsers && req.user.blockedUsers.some(id => id.toString() === participantId.toString());
    const isBlockedBy = recipient.blockedUsers && recipient.blockedUsers.some(id => id.toString() === req.user._id.toString());
    if (hasBlocked || isBlockedBy) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start conversation. You have blocked this user or they have blocked you.',
      });
    }

    // Find if conversation already exists
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, participantId],
      });
    }

    // Populate participants
    await conversation.populate({
      path: 'participants',
      select: 'name avatar college department year isVerified verificationStatus isSuspicious',
      populate: {
        path: 'college',
        select: 'name',
      },
    });

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations for the logged in user
// @route   GET /api/v1/chat/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const blockedByUser = req.user.blockedUsers || [];
    const usersWhoBlockedMe = await User.find({ blockedUsers: req.user._id }).distinct('_id');
    const allBlockedIds = [...blockedByUser, ...usersWhoBlockedMe];

    const query = { participants: req.user._id };
    if (allBlockedIds.length > 0) {
      query.participants = {
        $all: [req.user._id],
        $nin: allBlockedIds
      };
    }

    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .populate({
        path: 'participants',
        select: 'name avatar college department year isVerified verificationStatus isSuspicious',
        populate: {
          path: 'college',
          select: 'name',
        },
      })
      .populate('lastMessage');

    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/v1/chat/conversations/:id/messages
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const conversationId = req.params.id;

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you are not a participant',
      });
    }

    // Mark messages from other user as read
    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        read: false,
      },
      { $set: { read: true } }
    );

    const messages = await Message.find({ conversation: conversationId })
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send a message
// @route   POST /api/v1/chat/conversations/:id/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const conversationId = req.params.id;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you are not a participant',
      });
    }

    // Find recipient (the other participant)
    const otherParticipantId = conversation.participants.find(
      (id) => id.toString() !== req.user._id.toString()
    );

    if (otherParticipantId) {
      const recipient = await User.findById(otherParticipantId);
      if (recipient) {
        const hasBlocked = req.user.blockedUsers && req.user.blockedUsers.some(id => id.toString() === otherParticipantId.toString());
        const isBlockedBy = recipient.blockedUsers && recipient.blockedUsers.some(id => id.toString() === req.user._id.toString());
        if (hasBlocked || isBlockedBy) {
          return res.status(400).json({
            success: false,
            message: 'Cannot send message. You have blocked this user or they have blocked you.',
          });
        }
      }
    }

    // Create message
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      content: content.trim(),
    });

    // Update conversation lastMessage & trigger updatedAt timestamp update
    conversation.lastMessage = message._id;
    await conversation.save();

    res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    next(error);
  }
};
