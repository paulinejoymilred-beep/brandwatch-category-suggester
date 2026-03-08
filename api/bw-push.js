export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, projectId, taxonomy } = req.body;

  if (!token) return res.status(400).json({ error: 'Token is required' });
  if (!projectId) return res.status(400).json({ error: 'Project ID is required' });
  if (!taxonomy) return res.status(400).json({ error: 'Taxonomy is required' });

  const results = { created: [], failed: [] };

  try {
    for (const group of taxonomy) {
      for (const cat of group.categories) {
        try {
          const response = await fetch(`https://api.brandwatch.com/projects/${projectId}/categories`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: cat.name,
              queries: [
                {
                  name: cat.name,
                  booleanQuery: cat.boolean_rule
                }
              ]
            })
          });

          const data = await response.json();

          if (response.ok) {
            results.created.push(cat.name);
          } else {
            results.failed.push({ name: cat.name, error: data.message || 'Unknown error' });
          }
        } catch (err) {
          results.failed.push({ name: cat.name, error: err.message });
        }
      }
    }

    return res.status(200).json(results);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
