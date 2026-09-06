export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch (e) {}
    }

    if (!payload || typeof payload !== 'object') {
      return res.status(400).json({ error: { message: 'Invalid payload' } });
    }

    // Material mapping to valid backend values
    if (payload.material) {
      const mat = String(payload.material).toLowerCase();
      if (mat.includes('cardstock') || mat.includes('sbs') || mat.includes('white')) {
        payload.material = 'cardstock';
      } else if (mat.includes('corrugat') || mat.includes('flute')) {
        payload.material = 'corrugation';
      } else if (mat.includes('kraft') || mat.includes('brown')) {
        payload.material = 'kraft';
      }
    }

    const targetUrl = 'https://packagingdieline.com/api/dieline';
    const upstreamRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Referer': 'https://packagingdieline.com/studio.html',
        'Origin': 'https://packagingdieline.com',
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
      },
      body: JSON.stringify(payload)
    });

    const data = await upstreamRes.json();
    return res.status(upstreamRes.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: { message: err.message || String(err) } });
  }
}
