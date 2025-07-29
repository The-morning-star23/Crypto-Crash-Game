const User = require('../models/user.model');
const Transaction = require('../models/transaction.model');
const cryptoService = require('../services/crypto.service');
const gameService = require('../services/game.service');
const crypto = require('crypto');

// @desc    Place a bet
// @route   POST /api/game/bet
exports.placeBet = async (req, res) => {
  try {
    const { userId, betAmountUSD, currency } = req.body;

    // 1. Validation
    if (!userId || !betAmountUSD || !currency) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (betAmountUSD <= 0) {
      return res.status(400).json({ message: 'Bet amount must be positive' });
    }

    // 2. Fetch user and current crypto price
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const prices = await cryptoService.getPrices();
    const priceAtTime = prices[currency];

    // 3. Convert USD bet to crypto amount and check balance
    const cryptoAmount = betAmountUSD / priceAtTime;
    if (user.wallet[currency] < cryptoAmount) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }

    // 4. Deduct funds and add bet to the game service
    // Note: For a production app, this block should be wrapped in a database transaction
    // to ensure atomicity (all or nothing).
    user.wallet[currency] -= cryptoAmount;
    await user.save();
    
    // Add the bet to the current game round's list
    gameService.addBet({
      player_id: user._id,
      bet_amount_usd: betAmountUSD,
      bet_amount_crypto: cryptoAmount,
      currency: currency,
    });
    
    // 5. Log the transaction
    const transaction = new Transaction({
      player_id: user._id,
      usd_amount: betAmountUSD,
      crypto_amount: cryptoAmount,
      currency: currency,
      transaction_type: 'bet',
      transaction_hash: crypto.randomBytes(16).toString('hex'), // Mock hash
      price_at_time: priceAtTime
    });
    await transaction.save();

    res.status(200).json({ message: 'Bet placed successfully', newBalance: user.wallet });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};