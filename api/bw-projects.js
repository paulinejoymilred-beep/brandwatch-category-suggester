export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { token } = req.query;

  if (!token) return res.status(400).json({ error: 'Token is required' });

  try {
    const response = await fetch('https://api.brandwatch.com/projects', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Brandwatch API error' });
    }

    const projects = data.results.map(p => ({ id: p.id, name: p.name }));
    return res.status(200).json({ projects });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
