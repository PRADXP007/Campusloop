const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  startOrCreateConversation,
  getConversations,
  getMessages,
  sendMessage,
} = require('../controllers/chat.controller');

// All chat routes require authentication
router.use(protect);

router.post('/conversations', startOrCreateConversation);
router.get('/conversations', getConversations);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);

module.exports = router;
