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
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: `You are an expert in social media listening and Brandwatch Consumer Research.
Generate a professional category taxonomy for a ${industry} company called ${brand}, with the objective: ${objective}.

CRITICAL JSON RULES:
- Return ONLY a valid JSON array, nothing else
- No markdown, no backticks, no explanations
- For boolean_rule values: escape double quotes as \\" so the JSON stays valid

BOOLEAN RULE FORMATTING RULES — follow these exactly:
1. Single words must NOT be in quotes: cancel price cheaper unsubscribe
2. Multi-word expressions MUST use escaped double quotes like this: \\"content library\\" \\"subscription cost\\"
3. Use NEAR/x operator instead of AND to capture proximity between brand and topic
4. Group similar keywords with OR
5. Structure: (brand NEAR/10 (keyword OR \\"multi word phrase\\"))

Good boolean_rule examples (note the escaped quotes):
- (netflix NEAR/10 (price OR cost OR expensive OR cheaper OR \\"subscription fee\\" OR \\"monthly price\\")) OR (netflix NEAR/10 (cancel OR unsubscribe OR switching OR leaving))
- (apple NEAR/10 (\\"customer service\\" OR support OR help OR \\"tech support\\")) OR (apple NEAR/10 (broken OR defective OR \\"not working\\" OR malfunction))
- (loreal NEAR/10 (\\"brand image\\" OR reputation OR perception OR trust OR authenticity))

Format:
[
  {
    "parent": "Parent Category Name",
    "categories": [
      {
        "name": "Category Name",
        "description": "1-2 sentence description of what this category tracks and why it matters",
        "boolean_rule": "(${brand} NEAR/10 (keyword OR \\"multi word\\" OR keyword))"
      }
    ]
  }
]

Generate 4-6 parent categories, each with 2-4 sub-categories. Make rules specific and relevant to ${brand} in ${industry} with objective: ${objective}.`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Claude API error' });
    }

    let text = data.content[0].text;
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsed = JSON.parse(text);
    return res.status(200).json({ taxonomy: parsed });

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
