const User = require('../models/user.model');
const cryptoService = require('../services/crypto.service');

// @desc    Create a new user
// @route   POST /api/users
exports.createUser = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Give new users some starting funds for testing
    user = new User({
      username,
      wallet: { BTC: 1, ETH: 10 }
    });

    await user.save();
    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get a user's wallet balance
// @route   GET /api/users/:userId/wallet
exports.getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch latest prices to calculate USD equivalent
    const prices = await cryptoService.getPrices();
    const btcValueUSD = user.wallet.BTC * prices.BTC;
    const ethValueUSD = user.wallet.ETH * prices.ETH;
    const totalValueUSD = btcValueUSD + ethValueUSD;

    res.status(200).json({
      wallet: user.wallet,
      usd_equivalents: {
        BTC: btcValueUSD,
        ETH: ethValueUSD,
        total: totalValueUSD
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};