const { startGameLoop } = require('./src/services/game.service');
const gameService = require('./src/services/game.service');

// --- API Routes ---
const userRoutes = require('./src/api/user.routes');
const gameRoutes = require('./src/api/game.routes');

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require("socket.io");
const connectDB = require('./src/config/db');

// --- Initial Setup ---
const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity. In production, restrict this.
    methods: ["GET", "POST"]
  }
});

// Connect to the Database
connectDB();

// --- Middleware ---
// This allows us to accept JSON data in the request body
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/game', gameRoutes);

// --- Basic Route for Testing ---
app.get('/', (req, res) => {
  res.send('Crypto Crash Backend is running!');
});

// --- WebSocket Connection Logic (placeholder) ---
io.on('connection', (socket) => {
  console.log('A user connected with socket ID:', socket.id);
  
  socket.on('cashout', async (data) => {
    try {
      // The client will send their userId
      const { userId } = data;
      if (!userId) return;

      // Call the cashOut function from our game service
      await gameService.cashOut(userId);
      socket.emit('cashout_success', { message: 'Successfully cashed out!' });

    } catch (error) {
      // If something goes wrong (e.g., cashing out after crash), send error to the client
      console.error('Cashout error:', error.message);
      socket.emit('cashout_error', { message: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});


// --- Start the Server ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // Start the game loop and pass it the io instance
  startGameLoop(io);
});