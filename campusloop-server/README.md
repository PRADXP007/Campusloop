# ⚙️ CampusLoop Server — Express & Socket.io REST API

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-WebSocket-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media%20CDN-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

**High-performance backend API serving real-time WebSocket messaging, AISHE student institution verification, marketplace CRUD, and media uploads.**

</div>

---

## 🛠️ Features & Endpoints

- **Real-time Chat Socket Events**: `join_room`, `send_message`, `typing`, `message_delivered`
- **Institution Verification**: AISHE college database integration
- **Media Upload Pipeline**: Multer + Cloudinary streaming upload
- **Security**: Rate limiting, MongoDB sanitize, Helmet, JWT auth

### Local Setup
```bash
npm install
npm run dev
```
Default port: `5000`.
