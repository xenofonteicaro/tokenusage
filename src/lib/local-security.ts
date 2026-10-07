const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
export function isLocalRequest(request: Request, mutation = false): boolean {
  const host = request.headers.get("host");
  if (!host || request.headers.get("sec-fetch-site") === "cross-site")
    return false;
  let target: URL;
  try {
    target = new URL(`http://${host}`);
  } catch {
    return false;
  }
  if (!localHosts.has(target.hostname) || target.username || target.password)
    return false;
  const origin = request.headers.get("origin");
  if (!origin) return !mutation;
  try {
    const from = new URL(origin);
    return (
      ["http:", "https:"].includes(from.protocol) && from.host === target.host
    );
  } catch {
    return false;
  }
}
export const privateHeaders = {
  "Cache-Control": "no-store, private",
  "X-Content-Type-Options": "nosniff",
};
