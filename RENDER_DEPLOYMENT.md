# Render Deployment Guide

## Prerequisites
- GitHub account (already done ✓)
- MongoDB Atlas account (free)
- Render account

---

## Step 1: Set Up MongoDB Atlas (Database)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new project called "chat-app"
4. Create a **free M0 cluster**
5. Create a database user:
   - Go to Database Access → Add New Database User
   - Username: `admin`
   - Password: (generate secure password)
   - Save these credentials
6. Get connection string:
   - Go to Clusters → Connect
   - Choose "Drivers" → Node.js
   - Copy the connection string
   - Replace `<username>:<password>` with your credentials
   - Replace `myFirstDatabase` with `chatdb`
   - Example: `mongodb+srv://admin:PASSWORD@cluster.mongodb.net/chatdb?retryWrites=true&w=majority`

---

## Step 2: Deploy on Render

### Option A: Deploy Backend Only (Recommended First)

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click "New +" → "Web Service"
3. Select your GitHub repo `chats`
4. Fill in the form:
   - **Name**: `chat-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: Leave empty (Render will auto-detect)
5. Click "Advanced" and add **Environment Variables**:
   ```
   MONGODB_URI = mongodb+srv://admin:PASSWORD@cluster.mongodb.net/chatdb?retryWrites=true&w=majority
   CLIENT_URL = https://yourfrontend.vercel.app,https://chat-backend.onrender.com
   MESSAGE_SECRET = your-secret-key-12345
   PORT = 5000
   ```
6. Click "Create Web Service"
7. Wait for deployment (5-10 minutes)
8. Copy your backend URL: `https://chat-backend.onrender.com`

### Option B: Deploy Frontend to Vercel (Easier for Frontend)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Import your repository
3. Select `frontend` as root directory
4. Add **Environment Variable**:
   ```
   VITE_API_URL = https://chat-backend.onrender.com
   ```
5. Click "Deploy"
6. Your frontend will be live at: `https://yourproject.vercel.app`

### Option C: Deploy Frontend on Render Static

1. In Render, click "New +" → "Static Site"
2. Select your GitHub repo
3. Fill in:
   - **Name**: `chat-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
4. Add environment variable:
   ```
   VITE_API_URL = https://chat-backend.onrender.com
   ```
5. Click "Create Static Site"

---

## Step 3: Update Frontend API URL

Edit [frontend/src/services/api.js](../../frontend/src/services/api.js):

```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

Edit [frontend/src/services/socket.js](../../frontend/src/services/socket.js):

```javascript
const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

---

## Step 4: Update CORS in Backend

After you have URLs from Render/Vercel, update `CLIENT_URL` environment variable with both frontend URLs.

---

## Troubleshooting

### Build fails with "npm: command not found"
- Set **Build Command**: `cd backend && npm install && npm start`

### "Cannot find module" errors
- Ensure `package.json` and `package-lock.json` are in the backend folder
- Check that all dependencies are listed

### Socket.io connection fails
- Update `CLIENT_URL` environment variable with your frontend domain
- Check CORS settings in `backend/src/config/cors.js`

### MongoDB connection timeout
- Whitelist Render IPs in MongoDB Atlas:
  - Go to Network Access → IP Whitelist
  - Add `0.0.0.0/0` (allow all - only for development!)

---

## Free Tier Limits
- **Render**: 750 hours/month (can run ~1 service continuously)
- **MongoDB Atlas**: 5GB storage, free forever
- **Vercel**: Unlimited

---

## Final URLs After Deployment
- **Backend**: `https://chat-backend.onrender.com`
- **Frontend**: `https://yourproject.vercel.app` or `https://chat-frontend.onrender.com`
- **Database**: MongoDB Atlas (auto-manages)

---

## Cost Summary
- **Total**: FREE with free tiers
- **Optional**: Upgrade to $7/month on Render for better uptime
