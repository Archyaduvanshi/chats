const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const env = require('./src/config/env');
const corsOptions = require('./src/config/cors');
const connectDb = require('./src/config/db');
const registerChatSocket = require('./src/socket/chatSocket');

const startServer = async () => {
  await connectDb();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: corsOptions,
  });

  app.set('io', io);
  registerChatSocket(io);

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${env.port} is already in use. Stop the other backend server or set PORT in backend/.env.`);
      process.exit(1);
    }

    console.error('Server error:', error);
    process.exit(1);
  });

  server.listen(env.port, () => {
    console.log(`Chat API running on http://localhost:${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
