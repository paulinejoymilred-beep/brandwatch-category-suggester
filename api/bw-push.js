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
      try {
        // Each parent category becomes a Category with its subcategories as children
        const body = {
          name: group.parent,
          multiple: true,
          children: group.categories.map(cat => ({
            name: cat.name,
            rules: cat.boolean_rule ? [{
              filter: {
                search: cat.boolean_rule
              }
            }] : []
          }))
        };

        const response = await fetch(`https://api.brandwatch.com/projects/${projectId}/rulecategories`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        const data = await response.json();

        if (response.ok) {
          results.created.push(`${group.parent} (${group.categories.length} subcategories)`);
        } else {
          results.failed.push({ name: group.parent, error: data.message || JSON.stringify(data) });
        }
      } catch (err) {
        results.failed.push({ name: group.parent, error: err.message });
      }
    }

    return res.status(200).json(results);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
