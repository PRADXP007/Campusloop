# 🎓 CampusLoop — Enterprise All-in-One Indian College Marketplace & Student Network

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Realtime%20Chat-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media%20CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**The ultimate campus ecosystem for Indian universities: Verified student marketplace, real-time messaging, lost & found, and campus events feed.**

[Live Demo](https://campusloop.vercel.app) • [Report Issue](https://github.com/PRADXP007/Campusloop/issues) • [Request Feature](https://github.com/PRADXP007/Campusloop/issues)

</div>

---

## 📖 Overview

**CampusLoop** is a full-stack platform built specifically for Indian college campuses. It unifies a **peer-to-peer verified student marketplace** (buy/sell textbooks, electronics, cycle, lab coats, drafters), a **secure real-time chat system with buyer/seller safety negotiation**, a **Lost & Found desk**, and a **College Notice Board**. CampusLoop verifies students against official **AISHE (All India Survey on Higher Education)** institutional directories.

---

## ✨ Key Features

### 🛒 Verified Student Marketplace
- **Categorized Listings**: Textbooks, Lab Equipment, Engineering Drafters, Cycles, Electronics, Room Decor & Hostel Essentials.
- **Institutional Verification**: Restricts trade to verified university domains using official AISHE Indian institution lists.
- **High-Res Media Uploads**: Integrated with Cloudinary for fast CDN image optimization and thumbnail generation.

### 💬 Real-Time Buyer & Seller Messaging
- **Socket.io Instant Messaging**: Zero-latency peer-to-peer chat with typing indicators, message delivery status, and media attachments.
- **Built-in Deal Negotiation**: Make and accept offers directly within the chat interface.

### 🔍 Lost & Found Desk
- **Campus Recovery Board**: Report lost or found student ID cards, keys, ear buds, and calculators with reward tags and pickup spots.

### 🛡️ Enterprise Security & Moderation
- **Security Suite**: Protected by Helmet HTTP headers, Mongo sanitization (`express-mongo-sanitize`), rate limiting, JWT cookies, and Nodemailer OTP email verification.

---

## 🛠️ Architecture & Tech Stack

```
                                  ┌──────────────────────────┐
                                  │   Next.js 14 Client      │
                                  │ (Zustand / Tailwind / UI)│
                                  └─────────────┬────────────┘
                                                │ REST API / WebSocket
                                                ▼
                                  ┌──────────────────────────┐
                                  │ Express.js REST + Socket │
                                  └──────┬────────────┬──────┘
                                         │            │
                         ┌───────────────▼──┐      ┌──▼───────────────┐
                         │ MongoDB Database │      │  Cloudinary CDN  │
                         └──────────────────┘      └──────────────────┘
```

| Component | Stack |
| :--- | :--- |
| **Frontend Client** | [Next.js 14](https://nextjs.org/), [React 18](https://react.dev/), [Framer Motion](https://www.framer.com/motion/), [Lenis Scroll](https://lenis.darkroom.engineering/), [Zustand](https://zustand-demo.pmnd.rs/), [React Hook Form](https://react-hook-form.com/) |
| **Backend Server** | [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [Socket.io](https://socket.io/), [Nodemailer](https://nodemailer.com/) |
| **Database & Media**| [MongoDB](https://www.mongodb.com/) (Mongoose ODM), [Cloudinary CDN](https://cloudinary.com/) |
| **Verification** | AISHE Institutions directory (`aishe-institutions-list`, `indian-colleges`) |
| **Security** | Helmet, Express Rate Limit, Mongo Sanitize, JWT, bcryptjs |

---

## 📁 Monorepo Structure

```bash
campus-loop/
├── campusloop-client/      # Next.js 14 Frontend Application
│   ├── src/
│   │   ├── app/            # Marketplace, Chat, Lost & Found, Profile routes
│   │   ├── components/     # UI widgets, product cards, chat windows
│   │   ├── lib/            # Axios API client, Zustand stores
│   │   └── hooks/          # Socket.io & audio notification hooks
│   ├── package.json
│   └── playwright.config.ts# E2E test suites
└── campusloop-server/      # Express & Socket.io Backend API
    ├── src/
    │   ├── controllers/    # Auth, Listings, Messages, Colleges controllers
    │   ├── models/         # User, Product, Conversation, Report Mongoose models
    │   ├── routes/         # REST API endpoints
    │   ├── middleware/     # Auth, Upload (Multer-Cloudinary), Rate limiter
    │   ├── sockets/        # Socket.io chat handlers & presence tracking
    │   └── index.js        # Server bootstrap
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+`
- MongoDB database (local or MongoDB Atlas)
- Cloudinary account for image storage

---

### 1. Backend Server Setup (`campusloop-server`)

```bash
cd campusloop-server
npm install
```

Create a `.env` file in `campusloop-server/`:
```env
PORT=5000
MONGODB_URI="mongodb+srv://<username>:<password>@cluster.mongodb.net/campusloop"
JWT_SECRET="your_jwt_secret_key"
CLIENT_URL="http://localhost:3000"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Nodemailer (OTP / Email Verification)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

Start the backend:
```bash
npm run dev
```

---

### 2. Frontend Client Setup (`campusloop-client`)

```bash
cd ../campusloop-client
npm install
```

Create `.env.local` in `campusloop-client/`:
```env
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5000"
```

Start the client:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

### Client (`campusloop-client`):
- `npm run dev`: Starts Next.js development server
- `npm run build`: Production build
- `npm run start`: Runs production server
- `npm run test:e2e`: Runs Playwright end-to-end test suite

### Server (`campusloop-server`):
- `npm run dev`: Runs Express API with Nodemon auto-reloading
- `npm run start`: Starts production Node server

---

## 🌟 Contributing

We welcome contributions from students and developers across universities! Feel free to open issues or submit PRs.

---

<div align="center">
  <b>Built for students, by students | <a href="https://github.com/PRADXP007">PRADEEP H</a></b> 🎓✨
</div>
