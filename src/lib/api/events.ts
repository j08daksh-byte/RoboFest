export async function getEventHistory(filters: Record<string, string> = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.append(key, value);
  }

  const res = await fetch(`/api/events?${params.toString()}`);
  if (!res.ok) {
    throw new Error('Failed to fetch events');
  }
  return res.json();
}
