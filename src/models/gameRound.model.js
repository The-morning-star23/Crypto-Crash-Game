const mongoose = require('mongoose');

// This sub-schema defines the structure for each bet within a round
const betSchema = new mongoose.Schema({
  player_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bet_amount_usd: { type: Number, required: true },
  bet_amount_crypto: { type: Number, required: true },
  currency: { type: String, required: true, enum: ['BTC', 'ETH'] },
  cashout_multiplier: { type: Number, default: null }, // Stays null if the player busts
  payout_crypto: { type: Number, default: 0 }, // Winnings in crypto
  status: { type: String, enum: ['active', 'cashed_out', 'crashed'], default: 'active' },
}, { _id: false }); // _id: false because this is a subdocument

const gameRoundSchema = new mongoose.Schema({
  crash_point: {
    type: Number,
    required: true,
  },
  provably_fair: {
    seed: { type: String, required: true },
    hash: { type: String, required: true },
  },
  bets: [betSchema], // An array of bets using the schema defined above
}, {
  timestamps: true, // `createdAt` will mark the start time of the round
});

const GameRound = mongoose.model('GameRound', gameRoundSchema);

module.exports = GameRound;