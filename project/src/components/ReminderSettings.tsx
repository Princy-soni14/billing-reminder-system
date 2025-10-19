import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Your n8n webhook (use env variable for security)
  const n8nWebhook = process.env.VITE_N8N_WEBHOOK_URL;
  if (!n8nWebhook) {
    return res.status(500).json({ error: 'Webhook URL not configured' });
  }

  try {
    console.log('Proxy forwarding to n8n:', n8nWebhook);

    const n8nRes = await fetch(n8nWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });

    const text = await n8nRes.text();
    res.status(n8nRes.status).send(text);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Failed to reach n8n' });
  }
}
