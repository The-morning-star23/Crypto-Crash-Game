# Crypto Crash - Backend

Backend for "Crypto Crash", a real-time multiplayer betting game. Players bet in USD (converted to crypto), watch a multiplier increase, and try to cash out before it randomly crashes.

Tech stack: Node.js, Express, MongoDB, Socket.IO. Features a provably-fair RNG, real-time crypto price integration (CoinGecko), and simulated player wallets.

## Table of contents
- Overview
- Features
- Setup & installation
- Environment variables
- Running
- API endpoints
- WebSocket events
- Provably-fair algorithm
- USD ↔ Crypto conversion
- Live demo

## Overview
- Game loop runs every GAME_ROUND_INTERVAL (default 10s).
- Server generates a secret seed per round; the hash determines a crash point.
- Socket.IO broadcasts round events and accepts cash-out requests in real time.

## Features
- Provably fair round generation
- Real-time price fetching (CoinGecko) with short caching to avoid rate limits
- Bets placed in USD and stored/settled in crypto (BTC/ETH)
- WebSocket events for multiplier updates and round lifecycle

## Setup & installation

Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)
- Git

Clone and install
bash
git clone https://github.com/The-morning-star23/Crypto-Crash-Game.git
cd Crypto-Crash-Game
npm install

## Environment variables
Create a `.env` in project root with these variables:

PORT=3000

# MongoDB connection string (do NOT commit credentials)
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/<dbname>?retryWrites=true&w=majority

GAME_ROUND_INTERVAL=10000

Notes:
- Replace MONGO_URI with your own connection string. Do not publish secrets.
- CoinGecko API is used and requires no API key.

## Running
Development (auto-reload):
npm run dev

Production:
npm start

Server runs by default at http://localhost:3000

## API endpoints (summary)

Create user
- POST /api/users
- Body: { "username": "player1" }
- Returns created user with starter wallet (e.g., { BTC: 1, ETH: 10 })

Get wallet balance
- GET /api/users/:userId/wallet
- Returns crypto balances and USD equivalents using latest cached prices

Place a bet
- POST /api/game/bet
- Body: { "userId": "...", "betAmountUSD": 10, "currency": "BTC" }
- Bets accepted between rounds; USD converted to crypto at placement time

## WebSocket events

Server → Client
- round_start: signals round start
- multiplier_update: every ~100ms while running; payload: { "multiplier": 1.52 }
- round_crash: round ended; payload: { "crashPoint": 4.78 }
- player_cashed_out: broadcast when a player cashes out; payload:
  { "username": "player1", "cashout_multiplier": 2.5, "payout_usd": "25.00" }

Client → Server
- cashout: when a player cashes out; payload: { "userId": "..." }

## Provably-fair algorithm (summary)
- Server generates a cryptographically secure serverSeed before the round.
- Server publishes HMAC-SHA256 hash of that seed (seed is kept secret until round end).
- The hash deterministically maps to a crash multiplier.
- After the round finishes, server reveals the seed so clients can verify the hash → crashPoint mapping.

## USD-to-Crypto conversion
- Prices fetched from CoinGecko and cached (short TTL, e.g., 10s).
- Conversion at bet placement:
 CryptoAmount = USD_Bet / CurrentPrice_USD
- Winnings recorded in crypto; converted to USD for display using latest price.

## Live demo & hosting
- Live Frontend (Vercel): https://crypto-crash-frontend-black.vercel.app
- Live Backend (Render): https://crypto-crash-game-i6xw.onrender.com

## Notes & security
- Remove any hard-coded credentials from the repo and `.env` before publishing.
- Ensure your MongoDB user has appropriate permissions and rotate credentials if leaked.