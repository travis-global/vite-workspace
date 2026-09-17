export default async function handler(req, res) {
  const path = req.query.path
    ? Array.isArray(req.query.path)
      ? req.query.path.join("/")
      : req.query.path
    : "";

  const targetUrl = `http://34.59.189.231:8000/${path}`;

  const headers = { ...req.headers };

  delete headers.host;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body:
        req.method === "GET" || req.method === "HEAD"
          ? undefined
          : JSON.stringify(req.body),
    });

    const contentType = response.headers.get("content-type");

    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    res.status(response.status);

    const data = await response.arrayBuffer();

    res.send(Buffer.from(data));
  } catch (error) {
    console.error("Backend proxy error:", error);

    res.status(502).json({
      error: "Unable to connect to backend",
    });
  }
}
