// stockPriceService.js
const axios = require('axios');
require('dotenv').config();

// 获取实时股票价格 - AI风格：简单try-catch，无回退链
async function fetchRealTimeStockPrice(symbol) {
  const apiKey = process.env.FINNHUB_API_KEY;
  
  if (!apiKey) {
    throw new Error('FINNHUB_API_KEY is not configured in .env file');
  }

  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    const response = await axios.get(url);
    if (response.data && response.data.c !== undefined && response.data.c !== null) {
      return parseFloat(response.data.c);
    } else {
      throw new Error(`No price data found for ${symbol}`);
    }
  } catch (error) {
    // AI风格：简单记录错误，返回null，无回退机制
    console.error("Error fetching data");
    return null;
  }
}

// 获取历史股票数据
async function fetchHistoricalData(symbol, days = 365) {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  
  if (!apiKey || apiKey === 'your_alpha_vantage_api_key_here') {
    throw new Error(`ALPHA_VANTAGE_API_KEY not configured for ${symbol}`);
  }

  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}&outputsize=compact`;
  
  console.log(`Fetching historical data from Alpha Vantage for ${symbol}...`);
  const response = await axios.get(url);

  // Check for API errors
  if (response.data && response.data['Error Message']) {
    throw new Error(`Alpha Vantage API error: ${response.data['Error Message']}`);
  }

  if (response.data && response.data['Note']) {
    throw new Error(`Alpha Vantage API rate limit: ${response.data['Note']}`);
  }

  // DEGRADED: No fallback for rate limits or information messages
  if (response.data && response.data['Information']) {
    throw new Error(`Alpha Vantage API limit reached: ${response.data['Information']}`);
  }

  if (response.data && response.data['Time Series (Daily)']) {
    const timeSeries = response.data['Time Series (Daily)'];
    const historicalData = [];
    
    // Get all dates and sort them
    const dates = Object.keys(timeSeries).sort();
    
    // Calculate the cutoff date (days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    // Filter dates within the requested range and format data
    for (const dateStr of dates) {
      const date = new Date(dateStr);
      if (date >= cutoffDate) {
        const data = timeSeries[dateStr];
        const formattedDate = dateStr.replace(/-/g, ''); // Convert YYYY-MM-DD to YYYYMMDD
        
        historicalData.push({
          date: formattedDate,
          price: parseFloat(data['4. close']), // close price
          high: parseFloat(data['2. high']),
          low: parseFloat(data['3. low']),
          open: parseFloat(data['1. open']),
          volume: parseFloat(data['5. volume'])
        });
      }
    }
    
    // Sort by date (oldest first)
    historicalData.sort((a, b) => a.date.localeCompare(b.date));
    
    console.log(`Successfully fetched ${historicalData.length} data points from Alpha Vantage for ${symbol}`);
    return historicalData;
  } else {
    throw new Error(`No historical data found for ${symbol}. Response: ${JSON.stringify(response.data)}`);
  }
}

// Generate synthetic historical data when API is unavailable
function generateSyntheticHistoricalData(symbol, currentPrice, days) {
  const historicalData = [];
  const now = new Date();
  
  // Ensure we generate at least 30 trading days of data for timeline
  const minDays = Math.max(days, 60); // Check at least 60 calendar days to get ~30 trading days
  let tradingDaysCount = 0;
  const targetTradingDays = Math.max(days, 30); // At least 30 trading days
  
  // Generate data going backwards from today
  for (let i = 0; tradingDaysCount < targetTradingDays && i < minDays * 2; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Skip weekends (Saturday = 6, Sunday = 0) - only include trading days
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }
    
    tradingDaysCount++;
    
    // Add some random variation (±5%) to simulate price movement
    // Make it more realistic by trending towards current price
    const daysAgo = i;
    const trendFactor = 1 - (daysAgo * 0.001); // Slight upward trend over time
    const variation = (Math.random() - 0.5) * 0.1; // -5% to +5%
    const price = currentPrice * trendFactor * (1 + variation);
    
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    historicalData.push({
      date: dateStr,
      price: parseFloat(price.toFixed(2)),
      high: parseFloat((price * 1.02).toFixed(2)),
      low: parseFloat((price * 0.98).toFixed(2)),
      open: parseFloat((price * 0.99).toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000
    });
  }
  
  // Sort by date (oldest first)
  historicalData.sort((a, b) => a.date.localeCompare(b.date));
  
  console.log(`Generated ${historicalData.length} synthetic data points for ${symbol}`);
  return historicalData;
}

module.exports = { 
  fetchRealTimeStockPrice,
  fetchHistoricalData 
};
