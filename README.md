# CampusLoop

CampusLoop is an all-in-one platform for Indian college students, combining a verified campus marketplace, college updates feed, and a secure real-time chat system.

This repository is structured as a monorepo containing both the client frontend and the server backend:

- **[campusloop-client](./campusloop-client)**: Next.js frontend application with Framer Motion, Tailwind CSS, and Playwright E2E tests.
- **[campusloop-server](./campusloop-server)**: Node.js / Express backend API with MongoDB, WebSockets (Socket.io), and Nodemailer.

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB running locally (default: `mongodb://127.0.0.1:27017/campusloop`)

### Running the Project

1. **Start the Backend Server**:
   ```bash
   cd campusloop-server
   npm install
   npm run dev
   ```
   The backend API will run on [http://localhost:5005](http://localhost:5005).

2. **Start the Next.js Client**:
   ```bash
   cd campusloop-client
   npm install
   npm run dev
   ```
   The client application will run on [http://localhost:3000](http://localhost:3000).

### Running E2E Tests
To run Playwright E2E tests in Google Chrome:
```bash
cd campusloop-client
npm run test:e2e
```
