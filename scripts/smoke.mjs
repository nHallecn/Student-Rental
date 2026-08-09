const baseUrl = process.env.API_URL ?? 'http://localhost:4000';

async function get(path) {
  const response = await fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  return response.json();
}

const health = await get('/health');
if (health.status !== 'ok') throw new Error('Health response was not ok');
const universities = await get('/api/v1/universities');
if (!Array.isArray(universities.items)) throw new Error('University collection is invalid');
if (universities.items[0]) {
  const rentals = await get(`/api/v1/universities/${universities.items[0].id}/rentals`);
  if (!Array.isArray(rentals.items) || typeof rentals.total !== 'number') throw new Error('Rental collection is invalid');
}
console.info(`Smoke check passed (${health.mode} mode, ${universities.items.length} universities)`);

