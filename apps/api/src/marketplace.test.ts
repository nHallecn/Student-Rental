import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { DemoRepository } from './data/demo.repository.js';
import { setRepositoryForTests } from './data/index.js';

beforeEach(() => setRepositoryForTests(new DemoRepository()));
const login = async (app: ReturnType<typeof createApp>, identity: string) => (await request(app).post('/api/v1/auth/login').send({ identity, password: 'Demo123!' }).expect(200)).body.tokens.accessToken as string;

describe('student discovery and interaction', () => {
  it('performs public radius search with price, type and source filters', async () => {
    const app = createApp();
    const all = await request(app).get('/api/v1/universities/20000000-0000-4000-8000-000000000001/rentals?sort=CLOSEST').expect(200);
    expect(all.body.total).toBe(3);
    expect(all.body.items[0].distanceKm).toBeLessThanOrEqual(all.body.items[1].distanceKm);
    const filtered = await request(app).get('/api/v1/universities/20000000-0000-4000-8000-000000000001/rentals?maxPrice=55000&type=MODERN_ROOM&source=LANDLORD').expect(200);
    expect(filtered.body.items).toHaveLength(1);
    expect(filtered.body.items[0]).toMatchObject({ monthlyRent: 50000, source: 'LANDLORD', availabilityStatus: 'AVAILABLE' });
  });

  it('protects approximate coordinates while owners see the exact location', async () => {
    const app = createApp(); const propertyId = '40000000-0000-4000-8000-000000000001';
    const publicView = await request(app).get(`/api/v1/properties/${propertyId}`).expect(200);
    expect(publicView.body.property.latitude).toBeCloseTo(3.8641);
    expect(publicView.body.property.reviewNotes).toBeUndefined();
    const ownerToken = await login(app, 'landlord@demo.cm');
    const ownerView = await request(app).get(`/api/v1/properties/${propertyId}`).set('Authorization', `Bearer ${ownerToken}`).expect(200);
    expect(ownerView.body.property.latitude).toBe(3.8627);
  });

  it('saves a unit, records contact intent, and submits a report', async () => {
    const app = createApp(); const token = await login(app, 'student@demo.cm'); const unitId = '60000000-0000-4000-8000-000000000001';
    await request(app).post(`/api/v1/favourites/${unitId}`).set('Authorization', `Bearer ${token}`).expect(201);
    const favourites = await request(app).get('/api/v1/favourites').set('Authorization', `Bearer ${token}`).expect(200);
    expect(favourites.body.items[0].id).toBe(unitId);
    const contact = await request(app).post(`/api/v1/units/${unitId}/contact`).set('Authorization', `Bearer ${token}`).send({ method: 'WHATSAPP' }).expect(201);
    expect(contact.body.contact.phone).toBe('+237670000002');
    const report = await request(app).post('/api/v1/properties/40000000-0000-4000-8000-000000000001/report').set('Authorization', `Bearer ${token}`).send({ reason: 'WRONG_PRICE', description: 'The owner quoted a different amount.' }).expect(201);
    expect(report.body.report.status).toBe('OPEN');
  });
});

describe('landlord supply and administration', () => {
  it('creates a complete listing, submits it, and allows admin approval', async () => {
    const app = createApp(); const landlordToken = await login(app, 'landlord@demo.cm');
    const created = await request(app).post('/api/v1/properties').set('Authorization', `Bearer ${landlordToken}`).send({ name: 'Biyem-Assi Student Rooms', propertyCategory: 'MINI_CITE', description: 'Secure rooms close to transport.', city: 'Yaounde', neighbourhood: 'Biyem-Assi', landmark: 'Acacias junction', latitude: 3.849, longitude: 11.485, locationVisibility: 'APPROXIMATE', amenityIds: ['30000000-0000-4000-8000-000000000001'] }).expect(201);
    const propertyId = created.body.property.id as string;
    await request(app).post(`/api/v1/properties/${propertyId}/units`).set('Authorization', `Bearer ${landlordToken}`).send({ name: 'Room 2', unitType: 'ROOM', description: 'Simple clean room', monthlyRent: 40000, advanceMonths: 6, cautionAmount: 40000, visitFee: 0, agentCommission: 0, availabilityStatus: 'AVAILABLE' }).expect(201);
    await request(app).post(`/api/v1/properties/${propertyId}/images/remote`).set('Authorization', `Bearer ${landlordToken}`).send({ imageUrl: 'https://example.com/property.webp', thumbnailUrl: 'https://example.com/property-thumb.webp', position: 0 }).expect(201);
    const submitted = await request(app).post(`/api/v1/properties/${propertyId}/submit`).set('Authorization', `Bearer ${landlordToken}`).expect(200);
    expect(submitted.body.property.status).toBe('PENDING_REVIEW');
    const adminToken = await login(app, 'admin@demo.cm');
    const pending = await request(app).get('/api/v1/admin/properties/pending').set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(pending.body.items.some((item: { id: string }) => item.id === propertyId)).toBe(true);
    const approved = await request(app).patch(`/api/v1/admin/properties/${propertyId}/review`).set('Authorization', `Bearer ${adminToken}`).send({ decision: 'APPROVE' }).expect(200);
    expect(approved.body.property.status).toBe('ACTIVE');
    await request(app).get(`/api/v1/properties/${propertyId}`).expect(200);
  });

  it('updates availability in one action and exposes owner dashboard counts', async () => {
    const app = createApp(); const token = await login(app, 'landlord@demo.cm'); const unitId = '60000000-0000-4000-8000-000000000001';
    const changed = await request(app).patch(`/api/v1/units/${unitId}/availability`).set('Authorization', `Bearer ${token}`).send({ availabilityStatus: 'OCCUPIED' }).expect(200);
    expect(changed.body.unit.availabilityStatus).toBe('OCCUPIED');
    const dashboard = await request(app).get('/api/v1/dashboard/owner').set('Authorization', `Bearer ${token}`).expect(200);
    expect(dashboard.body.dashboard).toMatchObject({ properties: 2, activeProperties: 1, availableUnits: 0, occupiedUnits: 1 });
  });

  it('lets admins resolve reports, manage users and inspect marketplace health', async () => {
    const app = createApp(); const studentToken = await login(app, 'student@demo.cm');
    const report = await request(app).post('/api/v1/properties/40000000-0000-4000-8000-000000000001/report').set('Authorization', `Bearer ${studentToken}`).send({ reason: 'DUPLICATE', description: '' }).expect(201);
    const adminToken = await login(app, 'admin@demo.cm');
    const resolved = await request(app).patch(`/api/v1/admin/reports/${report.body.report.id}`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'RESOLVED', notes: 'Duplicate removed.' }).expect(200);
    expect(resolved.body.report.resolvedAt).toBeTruthy();
    const suspended = await request(app).patch('/api/v1/admin/users/10000000-0000-4000-8000-000000000003/suspension').set('Authorization', `Bearer ${adminToken}`).send({ suspended: true }).expect(200);
    expect(suspended.body.user.suspendedAt).toBeTruthy();
    const stats = await request(app).get('/api/v1/admin/stats').set('Authorization', `Bearer ${adminToken}`).expect(200);
    expect(stats.body.stats).toMatchObject({ users: 4, activeProperties: 2, openReports: 0 });
  });
});

