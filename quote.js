// api/quote.js - Proxy لـ API سهمك
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { symbol } = req.query;
  
  if (!symbol) {
    return res.status(400).json({ error: 'Symbol required' });
  }

  try {
    const response = await fetch(`https://app.sahmk.sa/api/v1/quote/${symbol}/`, {
      method: 'GET',
      headers: {
        'X-API-Key': 'shmk_live_30015ec94962c7dd46acc73ebea15979d36e266f76ee8758',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'TasiPro/1.0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SAHMK Error ${response.status}:`, errorText);
      throw new Error(`SAHMK API error: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch data', 
      message: error.message,
      symbol: symbol 
    });
  }
}