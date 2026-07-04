# Realtime Chat Application

A full-stack realtime chat app built with React, Node.js, Express, Socket.io, and optional MongoDB persistence. Users sign up with username, phone, and password, then chat immediately in joined rooms or one-to-one direct conversations. Messages are encrypted before storage using AES-256-GCM and decrypted by the backend when serving chat history.

## Features

- Signup/login with JWT sessions
- Immediate account access after signup
- Room chat with room key, optional password, invite link, member count, and room creator/admin details
- One-to-one direct chat by phone number or username
- Centered chat-mode selection screen with only Chat by phone, Chat by username, and Room chat before any message composer is shown
- Direct chat presence indicators: green check for online users, red dot for offline users
- Direct chat unread badges beside phone numbers/usernames when the receiver has not opened or read new messages
- Direct chat three-dot options menu with a remove action
- WhatsApp-style direct chat removal: removing a user hides and clears that conversation only for the current account, without deleting it for the other user
- Removed direct chats can reappear when either user starts the conversation again, while previously cleared messages stay hidden for the user who removed the chat
- Direct chat message status:
  - Single check when the receiver is offline
  - Double check when the receiver is online
  - Blue double check when the receiver has read the chat
- Room metadata is shown only in room chat, not in phone/username direct chats
- Direct users must select a phone/username chat before sending a message
- Room users must create, join, or select a room before sending a message
- The composer stays writable after a chat is selected; message loading does not block typing
- Empty conversations show `No messages yet. Start the conversation.` after history loading completes
- Direct chat history is isolated per two-user conversation, so other users cannot see that private chat
- REST API for auth, rooms, messages, and read status
- Socket.io realtime message broadcasting
- Socket.io online status connects after login, even before a chat is selected
- Previous messages after refresh
- Message timestamps
- Typing indicator
- Message options menu with copy, edit, and delete actions
- Sender-only message editing within 1 minute of sending
- Sender-only message deletion
- Stale/expired sessions are cleared on unauthorized API responses
- Fully responsive Tailwind CSS interface
- MongoDB storage when `MONGODB_URI` is configured
- Local JSON fallback storage for development

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Socket.io Client, Lucide React
- Backend: Node.js, Express, Socket.io
- Database: MongoDB with Mongoose, or local JSON fallback
- Encryption: AES-256-GCM encryption at rest
- Deployment: Render

## Project Structure

```txt
backend/
  src/
    config/
    controllers/
    middleware/
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
    index.css
```

The frontend styling uses Tailwind utility classes directly in React components. `frontend/src/index.css` keeps the Tailwind import and small global base styles.

## Local Development

### Backend Setup

```bash
cd backend
npm install
npm start
```

The backend runs on `http://localhost:5000`.

For development with auto-restart, use the backend dev script if configured:

```bash
npm run dev
```

### Backend Environment

Create or update `backend/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173
MONGODB_URI=
JWT_SECRET=change-this-long-random-jwt-secret
MESSAGE_SECRET=change-this-long-random-message-secret
```

`MONGODB_URI` is optional. If it is empty, the app uses local JSON fallback storage.

### Frontend Setup

```bash
cd frontend
npm install
npm.cmd run dev
```

Use `npm.cmd` from PowerShell if `npm.ps1` is blocked by Windows execution policy.

The frontend usually runs on `http://localhost:5173`. If that port is busy, Vite will choose the next available port.

### Frontend Environment

Create or update `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## How The App Works

1. Users sign up or log in with a username/phone and password.
2. New accounts receive a session immediately after signup.
3. Signed-in users first see a centered chat choice panel with Chat by phone, Chat by username, and Room chat.
4. Choosing Chat by phone or Chat by username expands previous direct chats under that option, plus an input to start a new direct chat.
5. Choosing Room chat expands joined rooms and room create/join controls.
6. Selecting a direct user or room opens a dedicated message page for that conversation.
7. The message composer is hidden until the current chat mode has a valid selected conversation:
   - Phone/username chat requires a selected direct user.
   - Room chat requires a selected joined or created room.
8. After a conversation is selected, the composer is enabled even while messages are being fetched.
9. Direct chats show online/offline presence, unread message badges, and WhatsApp-style sent/delivered/read ticks.
10. Unread badges appear only beside phone/username direct chats and clear when that conversation is opened/read.
11. The three-dot menu on a direct chat lets the current user remove that conversation from their own account only.
12. Removing a direct chat records a per-user cleared timestamp, so older messages stay hidden for the remover but remain available to the other participant.
13. Room chats show room key, member count, creator/admin, member list, and invite controls.

## API Endpoints

### Health

- `GET /api/health` - health check

### Auth

- `POST /api/auth/signup` - create user
- `POST /api/auth/login` - login user
- `GET /api/auth/me` - get current authenticated user

Example signup:

```json
{
  "username": "arch",
  "phone": "+919999999999",
  "password": "secret123"
}
```

Example login:

```json
{
  "username": "arch",
  "password": "secret123"
}
```

### Rooms

- `GET /api/rooms` - list rooms available to the authenticated user
- `POST /api/rooms` - create a room
- `POST /api/rooms/join` - join a room by id/code/password/invite
- `POST /api/rooms/direct` - create or open a direct room by phone or username
- `DELETE /api/rooms/direct/:roomId` - remove a direct conversation for the authenticated user only

Direct rooms returned by `GET /api/rooms` include an `unreadCount` field for the authenticated user. This count is used only in the Chat by phone and Chat by username lists.

Removing a direct room does not delete the room or messages for the other user. The backend stores per-user visibility/clear metadata and filters history/unread counts for the user who removed the conversation.

Example create room:

```json
{
  "name": "Project Team",
  "password": "optional-password",
  "maxMembers": 50
}
```

Example join room:

```json
{
  "roomCode": "A1B2C3D4",
  "password": "optional-password",
  "inviteCode": ""
}
```

Example direct chat:

```json
{
  "username": "+919999999999"
}
```

The `username` field accepts either a user's username or phone number.

### Messages

- `GET /api/messages?roomId=<roomId>` - fetch chat history for a room/direct chat
- `POST /api/messages` - send a message
- `PATCH /api/messages/read` - mark messages as read in a room/direct chat
- `PATCH /api/messages/:id` - edit the sender's message within 1 minute
- `DELETE /api/messages/:id` - delete the sender's message

All protected endpoints require:

```txt
Authorization: Bearer <token>
```

Example send message:

```json
{
  "roomId": "room-id-here",
  "text": "Hello"
}
```

Example edit message:

```json
{
  "text": "Updated message"
}
```

Example mark read:

```json
{
  "roomId": "room-id-here"
}
```

## Socket.io Events

- `user:join` - join the active room and register online status
- `message:send` - send a message in realtime
- `message:new` - receive a new message
- `message:edit` - edit a sender's message within 1 minute
- `message:updated` - receive an edited message
- `message:delete` - delete a sender's message
- `message:deleted` - remove a deleted message from clients
- `users:online` - receive online usernames visible through shared direct/room conversations
- `rooms:refresh` - ask clients to reload the room/direct chat list after direct conversation visibility changes
- `unread:update` - update a direct chat unread badge for a specific room
- `typing:start` / `typing:stop` - typing indicator
- `messages:read` - update read status

## Deployment

### Backend on Render

1. Create a Render Web Service from the repo.
2. Use:

```txt
Build Command: cd backend && npm install
Start Command: cd backend && npm start
```

3. Add environment variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatdb
CLIENT_URL=https://your-frontend-url.onrender.com
JWT_SECRET=use-a-long-random-jwt-secret
MESSAGE_SECRET=use-a-long-random-message-secret
PORT=5000
```

### Frontend on Render

1. Create a Render Static Site from the repo.
2. Use:

```txt
Build Command: cd frontend && npm install && npm run build
Publish Directory: frontend/dist
```

3. Add environment variables:

```env
VITE_API_URL=https://your-backend-url.onrender.com
VITE_SOCKET_URL=https://your-backend-url.onrender.com
```

After changing Vite environment variables, redeploy the frontend.

## Troubleshooting

If you see `401 Unauthorized`:

- Log in again; the frontend clears stale sessions when the backend rejects a saved token.
- Confirm API requests include `Authorization: Bearer <token>`.

If messages do not send:

- Make sure a direct user is selected in phone/username chat.
- Make sure a room is selected in room chat.
- If the message box is disabled, go back and select the conversation again; the composer should be enabled as soon as a valid chat is selected.
- Check `VITE_API_URL` and `VITE_SOCKET_URL` in the frontend environment.
- Confirm both values point to the backend URL.

If a selected chat is stuck on `Loading messages...`:

- Restart the frontend dev server after pulling updates.
- Confirm the backend is running and `VITE_API_URL` points to it.
- The app now loads messages by selected room id, so unread badge updates should not keep the chat in a loading loop.

If room chat does not work:

- Create a room, or join one with room key/password/invite.
- Room metadata appears only for room chats.

If direct chat presence does not update:

- Make sure both users are logged in and connected to Socket.io.
- Check `VITE_SOCKET_URL`.

If unread direct message counts do not update:

- Restart the backend after pulling the latest socket changes.
- Make sure the receiver is logged in so Socket.io can deliver `unread:update`.
- Make sure clients receive `rooms:refresh` after a hidden direct chat becomes visible again.
- Confirm the conversation is a direct phone/username chat, not a room chat.
- Opening the direct chat marks its messages as read and clears the badge.

If a removed direct chat appears again:

- This is expected when either participant starts or sends a new message in that direct conversation.
- Messages sent before the current user's remove action stay hidden for that user.
- The other participant's copy of the conversation is not changed by the remove action.

If you see CORS errors:

- Check `CLIENT_URL` in the backend environment.
- It must include the frontend URL.
- Redeploy the backend after changing it.

If the backend starts but data is not saved:

- Check `MONGODB_URI`.
- Make sure MongoDB Atlas allows network access.
- Make sure the database username and password are correct.
- If `MONGODB_URI` is empty, the app uses local JSON fallback storage.

## Design Decisions

- React web was used because the project is a Vite React app.
- Tailwind CSS is used for the responsive UI, with component-level utility classes.
- Socket.io is the primary realtime channel, with REST APIs used for history and fallback actions.
- Messages are encrypted at rest with AES-256-GCM before being stored.
- MongoDB is supported through Mongoose, while JSON fallback keeps local development simple.
- Direct chat and room chat intentionally have different UI rules: direct chats focus on peer presence/read ticks, while room chats show room membership and invite details.

## Assumptions

- Any signed-in user can chat.
- Users cannot fetch a global list of other accounts.
- A user can only read/send messages in rooms they belong to.
- Direct chats are private rooms with exactly two users.
- Direct chat removal is per-user visibility and history filtering, not global deletion.
- Encryption is server-side encryption at rest, not end-to-end encryption.
- Read status is based on users opening a room/direct chat and marking its messages as read.
- Unread direct counts include messages sent by the other user that the current user has not read and that were sent after the current user's direct-chat clear timestamp.

## Useful References

- Render Web Services: https://render.com/docs/web-services
- Render Static Sites: https://render.com/docs/static-sites
- Render Environment Variables: https://render.com/docs/configure-environment-variables
