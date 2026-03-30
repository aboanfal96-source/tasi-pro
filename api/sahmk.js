export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const apiPath = req.query.path || req.query.symbol ? `/quote/${req.query.symbol}/` : null;
  if (!apiPath && !req.query.path) {
    return res.status(400).json({ error: 'path or symbol required' });
  }

  const finalPath = req.query.path || apiPath;
  const API_KEY = process.env.SAHMK_KEY || 'shmk_live_30015ec94962c7dd46acc73ebea15979d36e266f76ee8758';

  try {
    const url = `https://app.sahmk.sa/api/v1${finalPath}`;
    const response = await fetch(url, {
      headers: {
        'X-API-Key': API_KEY,
        'User-Agent': 'TasiPro/1.0'
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Sahmk API: ${response.status}` });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
