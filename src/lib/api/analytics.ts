export async function getAnalytics(timeRange: string = 'all') {
  const res = await fetch(`/api/analytics?timeRange=${timeRange}`);
  if (!res.ok) {
    throw new Error('Failed to fetch analytics');
  }
  return res.json();
}
