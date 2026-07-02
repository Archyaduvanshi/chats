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

## Backend Setup

```bash
cd backend
npm install
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

## Deploy on Render

This project should be deployed as two Render services:

- Backend: Render Web Service
- Frontend: Render Static Site

You also need a MongoDB database. MongoDB Atlas is recommended for deployment.

### 1. Push the Project to GitHub

Render deploys from a Git repository.

```bash
git init
git add .
git commit -m "Initial realtime chat app"
git branch -M main
git remote add origin https://github.com/your-username/your-repo-name.git
git push -u origin main
```

If the project is already on GitHub, push your latest changes.

### 2. Create MongoDB Atlas Database

1. Go to MongoDB Atlas.
2. Create a free cluster.
3. Create a database user.
4. Allow network access.
5. Copy your MongoDB connection string.

The connection string looks like this:

```txt
mongodb+srv://username:password@cluster-name.mongodb.net/chat-app
```

Use this value as `MONGODB_URI` in Render.

### 3. Deploy the Backend on Render

1. Open the Render Dashboard.
2. Click New > Web Service.
3. Connect your GitHub repository.
4. Configure the backend service:

```txt
Name: chat-backend
Root Directory: backend
Runtime: Node
Build Command: npm install
Start Command: npm run start
```

5. Add backend environment variables:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
MESSAGE_SECRET=your_long_random_secret_key
CLIENT_URL=https://your-frontend-service-name.onrender.com
```

Do not add `PORT` on Render unless you need a custom setting. Render provides the port automatically.

6. Click Create Web Service.
7. After deployment, copy the backend URL.

Example backend URL:

```txt
https://chat-backend.onrender.com
```

Test the backend:

```txt
https://chat-backend.onrender.com/api/health
```

You should see:

```json
{
  "ok": true,
  "service": "chat-api"
}
```

### 4. Deploy the Frontend on Render

1. Open the Render Dashboard.
2. Click New > Static Site.
3. Connect the same GitHub repository.
4. Configure the frontend service:

```txt
Name: chat-frontend
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
```

5. Add frontend environment variables:

```env
VITE_API_URL=https://chat-backend.onrender.com
VITE_SOCKET_URL=https://chat-backend.onrender.com
```

Replace `https://chat-backend.onrender.com` with your real backend Render URL.

6. Click Create Static Site.
7. After deployment, copy the frontend URL.

Example frontend URL:

```txt
https://chat-frontend.onrender.com
```

### 5. Update Backend CORS After Frontend Deploy

After the frontend is deployed, go back to the backend service on Render and update:

```env
CLIENT_URL=https://chat-frontend.onrender.com
```

If you want to allow local development and production at the same time:

```env
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173,https://chat-frontend.onrender.com
```

Save the environment variable and redeploy the backend.

### 6. Final Deployment Test

Open your frontend URL:

```txt
https://chat-frontend.onrender.com
```

Test with two browser tabs or two devices:

1. Open the frontend URL.
2. Enter a username.
3. Open the same URL in another tab or device.
4. Enter a different username.
5. Send a message.
6. The message should appear instantly in both places.

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
