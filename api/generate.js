export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { brand, industry, objective, apiKey } = req.body;

  if (!apiKey) return res.status(400).json({ error: 'API key is required' });
  if (!brand || !industry || !objective) return res.status(400).json({ error: 'All fields are required' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `You are an expert in social media listening and Brandwatch Consumer Research.
Generate a professional category taxonomy for a ${industry} company called ${brand}, with the objective: ${objective}.

Return ONLY a valid JSON array. No explanation, no markdown, no backticks, just the raw JSON.

Format:
[
  {
    "parent": "Parent Category Name",
    "categories": [
      {
        "name": "Category Name",
        "description": "1-2 sentence description of what this category tracks and why it matters for social listening",
        "boolean_rule": "A Brandwatch-compatible boolean rule using AND, OR, NOT operators and quotes for exact phrases. Example: (\\"brand love\\" OR \\"love loreal\\" OR \\"obsessed with\\") AND (loreal OR \\"l'oreal\\")"
      }
    ]
  }
]

Generate 4-6 parent categories, each with 2-4 sub-categories. Make them specific, actionable, and relevant to social listening for ${brand} in ${industry} with objective: ${objective}. Boolean rules must be realistic, specific, and ready to use in Brandwatch.`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Claude API error' });
    }

    const text = data.content[0].text;
    const parsed = JSON.parse(text);
    return res.status(200).json({ taxonomy: parsed });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
