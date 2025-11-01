// Use standard Node-style req/res without Vercel-specific types
// Use standard Node-style req/res without Vercel-specific types

const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export default async function handler(req: any, res: any) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY on server' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = req.body;

    // Basic validation: expect messages array and model field (common for chat completions)
    if (!payload || !Array.isArray(payload.messages)) {
      return res.status(400).json({ error: 'Invalid payload: expected { messages: [...] }' });
    }

    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': req.headers?.origin || '',
        'X-Title': 'Bilingual Fitness Web App',
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: text });
    }

    const data = await resp.json();
    return res.status(200).json(data);
  } catch (e: any) {
    // Include stack in development for easier debugging
    const err = { error: e?.message || 'Unknown error' } as any;
    if (process.env.NODE_ENV !== 'production') err.stack = e?.stack;
    return res.status(500).json(err);
  }
}