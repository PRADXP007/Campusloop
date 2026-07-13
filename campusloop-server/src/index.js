require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');

// Routes
const authRoutes     = require('./routes/auth.routes');
const userRoutes     = require('./routes/user.routes');
const collegeRoutes  = require('./routes/college.routes');
const stateRoutes    = require('./routes/state.routes');
const districtRoutes = require('./routes/district.routes');
const listingRoutes  = require('./routes/listing.routes');
const postRoutes     = require('./routes/post.routes');
const chatRoutes     = require('./routes/chat.routes');

const app = express();

// ─── Security Middlewares ───────────────────────────────────────────────────
app.use(helmet());
// Sanitize inputs in-place to prevent NoSQL injections without reassigning req.query (Express v5 compatibility)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) {
    for (const key in req.query) {
      if (key.startsWith('$') || key.includes('.')) {
        delete req.query[key];
      }
    }
  }
  next();
});

// ─── Database ─────────────────────────────────────────────────────────────
connectDB();

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true, // allow cookies
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting — 100 requests per 15 minutes per IP (relaxed in development)
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter limit on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 20,
  message: { success: false, message: 'Too many auth attempts. Please try again in 15 minutes.' },
});

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1/auth',      authLimiter, authRoutes);
app.use('/api/v1/users',     userRoutes);
app.use('/api/v1/colleges',  collegeRoutes);
app.use('/api/v1/states',    stateRoutes);
app.use('/api/v1/districts', districtRoutes);
app.use('/api/v1/listings',  listingRoutes);
app.use('/api/v1/posts',     postRoutes);
app.use('/api/v1/chat',      chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('/*splat', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Error handler ────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start server with Socket.io ──────────────────────────────────────────
const http = require('http');
const { Server } = require('socket.io');
const { verifyAccessToken } = require('./utils/jwt');
const User = require('./models/User');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  }
});

// Socket.io Handshake Auth Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers['authorization']?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select('_id name avatar');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    return next(new Error('Authentication error: Invalid Token'));
  }
});

// Socket.io Events
io.on('connection', (socket) => {
  console.log(`⚡ User connected: ${socket.user.name} (${socket.id})`);

  socket.on('join_conversation', ({ conversationId }) => {
    socket.join(conversationId);
    console.log(`🗣️ User ${socket.user.name} joined room: ${conversationId}`);
  });

  socket.on('leave_conversation', ({ conversationId }) => {
    socket.leave(conversationId);
    console.log(`🗣️ User ${socket.user.name} left room: ${conversationId}`);
  });

  socket.on('send_message', async ({ conversationId, content }) => {
    try {
      if (!content || !content.trim()) return;

      // 1. Create message
      const message = await Message.create({
        conversation: conversationId,
        sender: socket.user._id,
        content: content.trim(),
      });

      // 2. Update parent conversation metadata
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        $set: { updatedAt: new Date() }
      });

      // 3. Emit message back to the room
      io.to(conversationId).emit('receive_message', message);
    } catch (err) {
      socket.emit('error_message', { message: 'Failed to send message real-time' });
    }
  });

  socket.on('typing', ({ conversationId }) => {
    socket.to(conversationId).emit('user_typing', {
      userId: socket.user._id,
      userName: socket.user.name,
      isTyping: true,
    });
  });

  socket.on('stop_typing', ({ conversationId }) => {
    socket.to(conversationId).emit('user_typing', {
      userId: socket.user._id,
      userName: socket.user.name,
      isTyping: false,
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.user.name}`);
  });
});
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 CampusLoop API + WebSockets running on http://localhost:${PORT}`);
  });
}

module.exports = app;
