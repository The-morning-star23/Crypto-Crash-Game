const axios = require('axios');

// A simple in-memory cache
const cache = {
  prices: null,
  lastFetch: 0,
};

const CACHE_DURATION = 10000; // 10 seconds

async function getPrices() {
  const now = Date.now();
  
  // Return cached prices if valid
  if (cache.prices && (now - cache.lastFetch < CACHE_DURATION)) {
    return cache.prices;
  }

  try {
    // Try to fetch from CoinGecko
    console.log('Fetching fresh crypto prices...');
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd',
      { timeout: 5000 } // Stop waiting after 5 seconds
    );
    
    const prices = {
      BTC: response.data.bitcoin.usd,
      ETH: response.data.ethereum.usd,
    };
    
    cache.prices = prices;
    cache.lastFetch = now;
    return prices;

  } catch (error) {
    console.error('Crypto API failed (using fallback):', error.message);
    
    if (cache.prices) return cache.prices;
    
    return {
      BTC: 95000, 
      ETH: 3400 
    };
  }
}

module.exports = { getPrices };