const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  player_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Creates a reference to the User model
    required: true,
  },
  usd_amount: {
    type: Number,
    required: true,
  },
  crypto_amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    required: true,
    enum: ['BTC', 'ETH'], // Ensures currency is one of the supported types
  },
  transaction_type: {
    type: String,
    required: true,
    enum: ['bet', 'cashout'],
  },
  // This would be a real hash on a blockchain, here it's just a mock string
  transaction_hash: {
    type: String,
    required: true,
  },
  price_at_time: {
    type: Number, // Stores the price of 1 crypto in USD at the transaction time
    required: true,
  },
}, {
  timestamps: true,
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;