export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });

  const API_KEY = process.env.SAHMK_KEY || 'shmk_live_30015ec94962c7dd46acc73ebea15979d36e266f76ee8758';

  try {
    const r = await fetch(`https://app.sahmk.sa/api/v1/quote/${symbol}/`, {
      headers: { 'X-API-Key': API_KEY }
    });
    if (!r.ok) throw new Error(`Sahmk returned ${r.status}`);
    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
