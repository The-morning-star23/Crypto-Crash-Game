const crypto = require('crypto');

// This function generates a crash point from a server seed.
// The math ensures a fair distribution with a slight house edge.
function generateCrashPoint(serverSeed) {
  // 1. Create a HMAC hash using the server seed
  const hash = crypto.createHmac('sha256', serverSeed).update('some-constant-string').digest('hex');

  // 2. Take the first 13 characters (52 bits) of the hash
  const hex = hash.substring(0, 13);
  const number = parseInt(hex, 16);

  // 3. Calculate the crash point
  // This formula ensures a 1% house edge. All outcomes are genuinely random.
  const E = Math.pow(2, 52);
  const crashPoint = Math.floor((100 * E - number) / (E - number)) / 100;

  // We cap the maximum crash point for game stability, e.g., at 1000x
  return {
    crashPoint: Math.min(crashPoint, 1000),
    hash: hash,
  };
}

module.exports = { generateCrashPoint };