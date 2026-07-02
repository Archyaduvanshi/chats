# Realtime Chat Application

A full-stack realtime chat app built with React, Node.js, Express, Socket.io, and optional MongoDB persistence. Messages are encrypted before storage using AES-256-GCM and decrypted only by the backend when serving chat history.

## Features

- Username-based dummy login
- REST API to send messages and fetch chat history
- Socket.io realtime message broadcasting
- Previous messages after refresh
- Message timestamps
- Online user list
- Typing indicator
- Delivered/read status
- MongoDB storage when `MONGODB_URI` is configured
- Local JSON fallback storage for development

## Tech Stack

- Frontend: React, Vite, Socket.io Client
- Backend: Node.js, Express, Socket.io
- Database: MongoDB with Mongoose
- Encryption: AES-256-GCM encryption at rest
- Deployment: Render

## Project Structure

```txt
backend/
  src/
    config/
    controllers/
    models/
    routes/
    services/
    socket/
    utils/
frontend/
  src/
    components/
    hooks/
    services/
    utils/
```

## Quick Start - Local Development

### Backend Setup

```bash
cd backend
npm install
npm start
```

Backend runs on: `http://localhost:5000`
npm run dev
```

The backend runs on `http://localhost:5000`.

### Backend Environment

Create or update `backend/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173
MONGODB_URI=
MESSAGE_SECRET=change-this-long-random-secret-for-production
```

`MONGODB_URI` is optional. If it is empty, messages are stored in `backend/data/messages.json`.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

### Frontend Environment

Create or update `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Deployment Instructions

### Live Demo
**Deployed Application**: https://chat-backend.onrender.com

### Step 1: MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster (M0)
3. Create database user with credentials
4. Whitelist IP: `0.0.0.0/0` (for development)
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/chatdb`

### Step 2: Deploy Backend on Render

1. Go to [Render Dashboard](https://render.com)
2. Click **New** → **Web Service**
3. Select your GitHub repo
4. Configuration:
   ```
   Name: chat-backend
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   Root Directory: (leave empty)
   ```
5. Environment Variables (click Advanced):
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatdb
   CLIENT_URL=https://your-frontend-url.onrender.com
   MESSAGE_SECRET=your-secret-key-here
   PORT=5000
   ```
6. Click **Create Web Service**
7. Wait 5-10 minutes for deployment
8. Copy backend URL (e.g., `https://chat-backend.onrender.com`)

### Step 3: Deploy Frontend on Render

1. Click **New** → **Static Site**
2. Select your GitHub repo
3. Configuration:
   ```
   Name: chat-frontend
   Build Command: cd frontend && npm install && npm run build
   Publish Directory: frontend/dist
   ```
4. Environment Variables:
   ```
   VITE_API_URL=https://chat-backend.onrender.com
   VITE_SOCKET_URL=https://chat-backend.onrender.com
   ```
5. Click **Create Static Site**
6. Wait 5 minutes for deployment
7. Copy frontend URL

### Step 4: Update Backend CORS

Update backend environment variable:
```
CLIENT_URL=https://your-frontend-url.onrender.com
```

---

---

## Project Submission Requirements

### ✅ Checklist for Course/Assignment Submission

**1. GitHub Repository Link**
```
https://github.com/Archyaduvanshi/chats.git
```

**2. Live Deployed Application**
- Frontend: `https://chat-frontend.onrender.com`
- Backend API: `https://chat-backend.onrender.com`

**3. Screen Recording**
- Record your app in action (2-3 minutes):
  - Login with username
  - Send messages in real-time
  - Show messages appearing in multiple windows
  - Display responsive design
- Upload to Google Drive and share link

**4. Google Drive Link**
- Share screen recording: [Your Google Drive Link]

**5. README with Setup Instructions** ✓
- This file includes:
  - Project structure
  - Local development setup
  - Deployment instructions
  - Features overview

**6. Submission Template**
```
Project: Realtime Chat Application
GitHub: https://github.com/Archyaduvanshi/chats.git
Live Demo: https://chat-frontend.onrender.com
Screen Recording: [Google Drive Link]
Tech Stack: React, Node.js, Express, Socket.io, MongoDB
```

### Render Troubleshooting

If messages do not send:

- Check `VITE_API_URL` and `VITE_SOCKET_URL` in the frontend Render service.
- They must point to the backend URL, not the frontend URL.
- Redeploy the frontend after changing Vite environment variables.

If you see CORS errors:

- Check `CLIENT_URL` in the backend Render service.
- It must include the frontend Render URL.
- Example: `https://chat-frontend.onrender.com`
- Redeploy the backend after changing environment variables.

If the backend starts but messages are not saved:

- Check `MONGODB_URI`.
- Make sure MongoDB Atlas allows network access.
- Make sure the database username and password are correct.

If Socket.io does not connect:

- Make sure `VITE_SOCKET_URL` uses `https://`, not `http://`, after deployment.
- Make sure the backend Render service is awake.
- Free Render services can sleep after inactivity, so the first request may take longer.

## Production Environment Summary

Backend Render Web Service:

```env
MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/chat-app
MESSAGE_SECRET=use-a-long-random-secret
CLIENT_URL=https://chat-frontend.onrender.com
```

Frontend Render Static Site:

```env
VITE_API_URL=https://chat-backend.onrender.com
VITE_SOCKET_URL=https://chat-backend.onrender.com
```

## API Endpoints

- `GET /api/health` - health check
- `GET /api/messages` - fetch chat history
- `POST /api/messages` - send a message
- `PATCH /api/messages/read` - mark messages as read for a username

Example `POST /api/messages` body:

```json
{
  "username": "Arch",
  "text": "Hello"
}
```

## Socket.io Events

- `user:join` - register the username for online status
- `message:send` - send a message in realtime
- `message:new` - receive a new message
- `users:online` - receive online users
- `typing:start` / `typing:stop` - typing indicator
- `messages:read` - update read status

## Design Decisions

- React web was used because the existing project is a Vite React app.
- Socket.io is the primary realtime channel. REST APIs are still available for sending and fetching messages.
- Messages are encrypted at rest with AES-256-GCM before being stored.
- MongoDB is supported through Mongoose, but a JSON fallback keeps the app runnable without local MongoDB setup.
- The frontend is organized into reusable UI components, a socket hook, API services, and utility helpers.

## Assumptions

- This is a single public chat room.
- Authentication is intentionally dummy username login, not production auth.
- Encryption is server-side encryption at rest, not end-to-end encryption.
- Read status is based on whether another connected user has opened the chat and marked messages as read.

## Useful References

- Render Web Services: https://render.com/docs/web-services
- Render Static Sites: https://render.com/docs/static-sites
- Render Environment Variables: https://render.com/docs/configure-environment-variables
