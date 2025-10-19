export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 🧩 Get dynamic target URL
  const targetUrl = req.query.url
    ? decodeURIComponent(req.query.url)
    : process.env.N8N_WEBHOOK_URL;

  if (!targetUrl) {
    return res.status(500).json({ error: "Webhook URL not configured" });
  }

  try {
    const n8nRes = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const text = await n8nRes.text();
    return res.status(n8nRes.status).send(text);
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Failed to reach n8n", details: err.message });
  }
}
