export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(204).end();
  }
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');

  const symbols = req.query.symbols;
  if (!symbols) return res.status(400).json({ error: 'symbols required' });

  const symArray = symbols.split(',').map(s => s.replace('.SR', '').trim()).filter(Boolean);
  const results = [];

  // Fetch from Google Finance - ALWAYS WORKS, no API key, no rate limit
  const batch = 5;
  for (let i = 0; i < symArray.length; i += batch) {
    const slice = symArray.slice(i, i + batch);
    const promises = slice.map(async (sym) => {
      try {
        const url = 'https://www.google.com/finance/quote/' + sym + ':TADAWUL?hl=en';
        const r = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
          }
        });
        if (!r.ok) return null;
        const html = await r.text();

        // Extract price
        const priceMatch = html.match(/data-last-price="([^"]+)"/) ||
                           html.match(/class="YMlKec fxKbKc"[^>]*>([^<]+)</) ||
                           html.match(/SAR\s*([\d,.]+)/);
        
        // Extract change percent
        const changePctMatch = html.match(/data-last-normal-market-change-percent="([^"]+)"/) ||
                               html.match(/data-change-percent="([^"]+)"/);

        // Extract previous close
        const prevMatch = html.match(/Previous close[^>]*>[^>]*>SAR\s*([\d,.]+)/) ||
                          html.match(/Previous close[^>]*>[^>]*>([\d,.]+)/);

        // Extract day range
        const rangeMatch = html.match(/Day range[^>]*>[^>]*>SAR\s*([\d,.]+)\s*-\s*SAR\s*([\d,.]+)/) ||
                           html.match(/Day range[^>]*>[^>]*>([\d,.]+)\s*-\s*([\d,.]+)/);

        // Extract name
        const nameMatch = html.match(/<div class="zzDege">([^<]+)</) ||
                          html.match(/<title>([^–(]+)/);

        if (priceMatch) {
          const price = parseFloat(priceMatch[1].replace(/,/g, ''));
          const changePct = changePctMatch ? parseFloat(changePctMatch[1]) : 0;
          const name = nameMatch ? nameMatch[1].trim().replace(' Stock Price', '') : sym;
          const low = rangeMatch ? parseFloat(rangeMatch[1].replace(/,/g, '')) : price;
          const high = rangeMatch ? parseFloat(rangeMatch[2].replace(/,/g, '')) : price;

          if (!isNaN(price) && price > 0) {
            return {
              symbol: sym + '.SR',
              regularMarketPrice: price,
              regularMarketChangePercent: changePct,
              regularMarketVolume: 0,
              regularMarketDayHigh: high,
              regularMarketDayLow: low,
              regularMarketOpen: price,
              shortName: name
            };
          }
        }
      } catch (e) {}
      return null;
    });

    const batchResults = await Promise.all(promises);
    batchResults.forEach(r => { if (r) results.push(r); });
    if (i + batch < symArray.length) await new Promise(r => setTimeout(r, 100));
  }

  return res.status(200).json({
    quoteResponse: { result: results },
    source: 'google_finance',
    count: results.length
  });
}
