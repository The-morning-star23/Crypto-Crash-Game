---Crypto Crash - Backend
This is the backend for "Crypto Crash," a real-time, multiplayer betting game. Players bet in USD, which is converted to cryptocurrency, and watch a multiplier increase until it randomly "crashes."

The project is built with Node.js, Express.js, MongoDB, and Socket.IO for real-time communication. It features a provably fair game algorithm, real-time crypto price integration, and simulated player wallets.

Overview of Approach
Game Logic: A central game.service.js manages the game state, runs the 10-second game loop, calculates the multiplier, and determines the crash point using a provably fair algorithm.

Crypto Integration: A crypto.service.js fetches and caches real-time prices from the CoinGecko API. All player balances are stored in crypto (BTC/ETH), and bets placed in USD are converted at the time of the bet.

WebSockets: A Socket.IO server manages real-time communication for broadcasting game events (round start, multiplier updates, crash) and handling player cash-out requests with minimal latency.

Setup and Installation
Prerequisites
Node.js (v16 or later)

MongoDB (or a MongoDB Atlas cloud instance)

Git

Installation Steps
Clone the repository: https://github.com/The-morning-star23/Crypto-Crash-Game.git

Bash

git clone https://github.com/The-morning-star23/Crypto-Crash-Game.git
cd crypto-crash-game

Install dependencies:
npm install

Create an environment file:
Create a file named .env in the root of the project and add the following variables.

# Server Configuration
PORT=3000

# Database Configuration
# Replace with your local or cloud MongoDB connection string
MONGO_URI=mongodb+srv://kumarshubh263:JfkE9DVMXCpKKsDz@crypto-crash-game.zicza1m.mongodb.net/?retryWrites=true&w=majority&appName=crypto-crash-game

# Game Configuration
# The time between game rounds in milliseconds
GAME_ROUND_INTERVAL=10000

Cryptocurrency API Configuration:
This project uses the free, public CoinGecko API to fetch cryptocurrency prices. No API key is required. The service is ready to use out of the box.

Running the Application:

For development (with auto-reload):
npm run dev

For production:
npm start
The server will be running at http://localhost:3000.

API Endpoint Descriptions:
Create User
Creates a new user and provides them with starting funds for testing.
URL: /api/users
Method: POST
Request Body:
JSON
{
  "username": "player1"
}
Success Response (201):
JSON
{
  "message": "User created successfully",
  "user": {
    "wallet": { "BTC": 1, "ETH": 10 },
    "_id": "632b...e4f",
    "username": "player1",
    "createdAt": "...",
    "updatedAt": "..."
  }
}

Get Wallet Balance:
Retrieves a user's crypto wallet balance and its equivalent value in USD.
URL: /api/users/:userId/wallet
Method: GET
Success Response (200):
JSON
{
  "wallet": { "BTC": 0.999833, "ETH": 10 },
  "usd_equivalents": {
    "BTC": 60000.50,
    "ETH": 30000,
    "total": 90000.50
  }
}

Place a Bet:
Places a bet for a user in an upcoming round. Bets can only be placed between rounds.
URL: /api/game/bet
Method: POST
Request Body:
JSON
{
  "userId": "632b...e4f",
  "betAmountUSD": 10,
  "currency": "BTC"
}
Success Response (200):
JSON
{
  "message": "Bet placed successfully",
  "newBalance": {
    "BTC": 0.999833,
    "ETH": 10
  }
}

WebSocket Event Descriptions:
Server-to-Client Events:
The server broadcasts these events to all connected clients.
round_start:

Description: Signals the start of a new game round. The multiplier begins increasing from 1.00x.
Payload: null

multiplier_update:

Description: Sent every 100ms while the game is running.
Payload:
JSON
{ "multiplier": 1.52 }

round_crash:

Description: Signals that the round has ended and the multiplier has crashed.
Payload:
JSON
{ "crashPoint": 4.78 }

player_cashed_out:

Description: Broadcast when any player successfully cashes out.
Payload:
JSON
{
  "username": "player1",
  "cashout_multiplier": 2.5,
  "payout_usd": "25.00"
}

Client-to-Server Events:
The client sends these events to the server.
cashout:

Description: Sent when a player wants to cash out their active bet.
Payload:
JSON
{ "userId": "632b...e4f" }

Core Concepts Explained:
Provably Fair Algorithm:
The game's outcome is determined by a provably fair algorithm, ensuring that the crash point is both random and tamper-proof.

The process for each round is as follows:

Secret Seed: Before the round begins, the server generates a cryptographically secure secret serverSeed.

Hashing: This seed is immediately hashed using HMAC-SHA256. This hash uniquely determines the outcome of the round. Because this is done before any bets are placed, the result cannot be altered.

Crash Point Generation: A mathematical formula is used to convert the generated hash into a multiplier value (the crashPoint). This formula is designed to provide a fair distribution of outcomes.

Verification: After the round is over, the original serverSeed is revealed and stored with the game round's history. Players can independently take this seed, apply the same hashing algorithm, and verify that it produces the exact same crashPoint that the game had, proving the result was not manipulated.

USD-to-Crypto Conversion Logic:
All bets are made in USD to provide a stable reference point for players, but the underlying mechanics operate in cryptocurrency.

Price Fetching: The backend calls the CoinGecko API to get the latest USD prices for BTC and ETH. To avoid hitting API rate limits, these prices are cached for 10 seconds.

Conversion Formula: When a player places a bet, the USD amount is converted to the selected cryptocurrency using the most recently cached price. The formula is:

Crypto Amount = USD Bet Amount / Current Price of Crypto in USD

This ensures that the crypto value of the bet is locked in at the moment it is placed. Winnings are calculated in crypto and then converted back to USD for display purposes using the latest price.