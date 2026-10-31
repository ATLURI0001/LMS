export default async function api(path, method = "GET", data) {
  const response = await fetch(`/api/${path}`, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
  });
  const result = await response
    .json()
    .catch(() => ({ error: "The server returned an unreadable response" }));
  if (!response.ok) {
    const e = new Error(result.error || result.detail || "Request failed");
    e.status = response.status;
    throw e;
  }
  return result;
}
