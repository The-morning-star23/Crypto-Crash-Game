const axios = require('axios');

// A simple in-memory cache
const cache = {
  prices: null,
  lastFetch: 0,
};

const CACHE_DURATION = 10000; // 10 seconds in milliseconds

async function getPrices() {
  const now = Date.now();
  // Check if cache is still valid
  if (cache.prices && (now - cache.lastFetch < CACHE_DURATION)) {
    console.log('Returning prices from cache.');
    return cache.prices;
  }

  try {
    console.log('Fetching fresh crypto prices...');
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd');
    
    const prices = {
      BTC: response.data.bitcoin.usd,
      ETH: response.data.ethereum.usd,
    };
    
    // Update cache
    cache.prices = prices;
    cache.lastFetch = now;

    return prices;
  } catch (error) {
    console.error('Error fetching crypto prices:', error.message);
    // If API fails, return the last known price from cache if available
    // In a real production app, you'd have more robust error handling/fallbacks
    if (cache.prices) {
        return cache.prices;
    }
    throw new Error('Could not fetch cryptocurrency prices.');
  }
}

module.exports = { getPrices };