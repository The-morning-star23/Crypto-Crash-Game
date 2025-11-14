const GameRound = require('../models/gameRound.model');
const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const { generateCrashPoint } = require('../utils/provablyFair');
const crypto = require('crypto');
const cryptoService = require('./crypto.service');

// --- Game State ---
let gameState = {
  status: 'waiting', // waiting -> running -> crashed
  multiplier: 1.00,
  startTime: null,
  crashPoint: null,
  roundId: null,
  activeBets: [],
};

let gameLoopInterval = null;
let tickerInterval = null;
let io = null; // Will be set by server.js

// --- Main Game Loop Function ---
function runGameRound() {
  // Generate server seed for this round
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const { crashPoint, hash } = generateCrashPoint(serverSeed);

  // Reset game state for a new round
  gameState = {
    ...gameState,
    status: 'running',
    multiplier: 1.00,
    startTime: Date.now(),
    crashPoint: crashPoint,
    roundId: null, // We'll get this after saving the round
    // activeBets is NOT cleared here, it's cleared in endRound
  };
  
  // Broadcast round start to all clients
  console.log(`--- New Round --- Crash Point: ${crashPoint}x`);
  io.emit('round_start');

  // Start the multiplier ticker
  tickerInterval = setInterval(() => {
    const elapsed = (Date.now() - gameState.startTime) / 1000; // time in seconds
    gameState.multiplier = parseFloat(Math.pow(1.05, elapsed).toFixed(2));

    // Check for crash
    if (gameState.multiplier >= gameState.crashPoint) {
      endRound(hash, serverSeed);
    } else {
      io.emit('multiplier_update', { multiplier: gameState.multiplier });
    }
  }, 100); // Update multiplier every 100ms
}

async function endRound(hash, serverSeed) {
  clearInterval(tickerInterval);
  gameState.status = 'crashed';
  
  console.log(`--- Round Crashed at ${gameState.crashPoint}x ---`);
  io.emit('round_crash', { crashPoint: gameState.crashPoint });

  // Grab a snapshot of the bets for this round
  const betsToSave = [...gameState.activeBets];
  // Immediately clear the active bets list for the next round
  gameState.activeBets = [];

  // Save the round to the database
  try {
    const round = new GameRound({
      crash_point: gameState.crashPoint,
      provably_fair: {
        seed: serverSeed,
        hash: hash,
      },
      bets: betsToSave, // Save the snapshot
    });
    await round.save();
  } catch (error) {
    console.error('Failed to save game round:', error);
  }

  // Set status to 'waiting' before the next loop starts
  gameState.status = 'waiting';
}

function addBet(betDetails) {
  // Basic validation to ensure betting is open
  if (gameState.status !== 'waiting') {
    throw new Error('Betting is closed for the current round.');
  }
  gameState.activeBets.push(betDetails);
  console.log('New bet placed:', betDetails);
}

async function cashOut(playerId) {
  // Check if game is in a state that allows cashing out
  if (gameState.status !== 'running') {
    throw new Error('Not a running game. Cannot cash out.');
  }

  // Find the player's active bet for this round
  const betIndex = gameState.activeBets.findIndex(
    (bet) => bet.player_id.toString() === playerId && bet.status === 'active'
  );

  if (betIndex === -1) {
    throw new Error('No active bet found for this player.');
  }

  // Get the current multiplier and calculate winnings
  const bet = gameState.activeBets[betIndex];
  const cashoutMultiplier = gameState.multiplier;
  const payoutCrypto = bet.bet_amount_crypto * cashoutMultiplier;

  // Update the bet status in the current game state
  bet.status = 'cashed_out';
  bet.cashout_multiplier = cashoutMultiplier;
  bet.payout_crypto = payoutCrypto;

  // Atomically update the user's wallet in the database
  const user = await User.findByIdAndUpdate(
    playerId,
    { $inc: { [`wallet.${bet.currency}`]: payoutCrypto } },
    { new: true } // Returns the updated document
  );

  // Log the cashout transaction
  const prices = await cryptoService.getPrices();
  const payoutUSD = payoutCrypto * prices[bet.currency];
  
  const transaction = new Transaction({
    player_id: playerId,
    usd_amount: payoutUSD,
    crypto_amount: payoutCrypto,
    currency: bet.currency,
    transaction_type: 'cashout',
    transaction_hash: crypto.randomBytes(16).toString('hex'),
    price_at_time: prices[bet.currency]
  });
  await transaction.save();

  // Announce the cashout to all players
  console.log(`Player ${user.username} cashed out at ${cashoutMultiplier}x`);
  io.emit('player_cashed_out', {
    username: user.username,
    cashout_multiplier: cashoutMultiplier,
    payout_usd: payoutUSD.toFixed(2),
  });

  return { username: user.username, cashoutMultiplier };
}

// This function is exported and called from server.js
function startGameLoop(socketIo) {
  io = socketIo;
  const roundInterval = parseInt(process.env.GAME_ROUND_INTERVAL, 10);

  // Run the first round immediately, then set the interval
  runGameRound();
  gameLoopInterval = setInterval(runGameRound, roundInterval);
}

module.exports = { startGameLoop, addBet, cashOut };