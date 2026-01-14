// lib/umami.ts
import 'dotenv/config';

export async function getUmamiStats() {
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  const apiKey = process.env.UMAMI_API_KEY;
  const endpoint = process.env.UMAMI_API_CLIENT_ENDPOINT || 'https://api.umami.is/v1';

  if (!websiteId) throw new Error('UMAMI_WEBSITE_ID is missing!');
  if (!apiKey) throw new Error('UMAMI_API_KEY is missing!');

  const startAt = new Date('2026-01-13T00:00:00Z').getTime();
  const endAt = Date.now();

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // Total visitors
  const statsRes = await fetch(`${endpoint}/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`, { headers });
  if (!statsRes.ok) throw new Error(`Failed to fetch stats: ${statsRes.statusText}`);
  const statsData = await statsRes.json();

  // Visitors by country
  const metricsRes = await fetch(`${endpoint}/websites/${websiteId}/metrics?startAt=${startAt}&endAt=${endAt}&type=country`, { headers });
  if (!metricsRes.ok) throw new Error(`Failed to fetch metrics: ${metricsRes.statusText}`);
  const metricsData = await metricsRes.json();

  const countries = metricsData.map((c: any) => ({
    country: c.x.toUpperCase(), // just return uppercase code
    value: c.y,
  }));

  return {
    totalVisitors: statsData.visitors,
    countries,
  };
}
