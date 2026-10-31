const API_BASE = "http://localhost:5000";

async function handle(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}

export async function analyzeText(text, url) {
  const res = await fetch(`${API_BASE}/api/analyze/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, url }),
  });
  return handle(res);
}

export async function analyzeImage(file) {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${API_BASE}/api/analyze/image`, { method: "POST", body: form });
  return handle(res);
}

export async function analyzeUrl(url, context) {
  const res = await fetch(`${API_BASE}/api/analyze/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, context }),
  });
  return handle(res);
}

export async function analyzePdf(file) {
  const form = new FormData();
  form.append("pdf", file);
  const res = await fetch(`${API_BASE}/api/analyze/pdf`, { method: "POST", body: form });
  return handle(res);
}