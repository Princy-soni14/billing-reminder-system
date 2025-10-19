export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const n8nWebhook = process.env.VITE_N8N_WEBHOOK_URL;
  if (!n8nWebhook) {
    return res.status(500).json({ error: "Webhook URL not configured" });
  }

  try {
    const n8nRes = await fetch(n8nWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const text = await n8nRes.text();
    return res.status(n8nRes.status).send(text);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Failed to reach n8n" });
  }
}
