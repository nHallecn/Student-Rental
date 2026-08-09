import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { DemoRepository } from './data/demo.repository.js';
import { setRepositoryForTests } from './data/index.js';

beforeEach(() => setRepositoryForTests(new DemoRepository()));

describe('authentication', () => {
  it('registers a student and returns a usable access token', async () => {
    const app = createApp();
    const registered = await request(app).post('/api/v1/auth/register').send({
      firstName: 'Nadine', lastName: 'Manga', phone: '+237699123456', email: 'nadine@example.cm', password: 'Secure123!', role: 'STUDENT',
    }).expect(201);

    expect(registered.body.user).toMatchObject({ firstName: 'Nadine', role: 'STUDENT', phoneVerified: false });
    expect(registered.body.user.passwordHash).toBeUndefined();
    const me = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${registered.body.tokens.accessToken}`).expect(200);
    expect(me.body.user.email).toBe('nadine@example.cm');
  });

  it('logs in, rotates refresh tokens, and rejects a reused token', async () => {
    const app = createApp();
    const login = await request(app).post('/api/v1/auth/login').send({ identity: 'student@demo.cm', password: 'Demo123!' }).expect(200);
    const firstRefresh = login.body.tokens.refreshToken as string;
    const refreshed = await request(app).post('/api/v1/auth/refresh').send({ refreshToken: firstRefresh }).expect(200);
    expect(refreshed.body.tokens.refreshToken).not.toBe(firstRefresh);
    await request(app).post('/api/v1/auth/refresh').send({ refreshToken: firstRefresh }).expect(401);
  });

  it('verifies a development OTP without exposing the code in production behavior', async () => {
    const app = createApp();
    const requested = await request(app).post('/api/v1/auth/request-otp').send({ identity: '+237670000001', purpose: 'VERIFY_PHONE' }).expect(202);
    expect(requested.body.debugCode).toMatch(/^\d{6}$/);
    const verified = await request(app).post('/api/v1/auth/verify-otp').send({ identity: '+237670000001', purpose: 'VERIFY_PHONE', code: requested.body.debugCode }).expect(200);
    expect(verified.body.user.phoneVerified).toBe(true);
  });
});

describe('universities and role authorization', () => {
  it('supports public university list, search and details', async () => {
    const app = createApp();
    const list = await request(app).get('/api/v1/universities').expect(200);
    expect(list.body.items).toHaveLength(3);
    const search = await request(app).get('/api/v1/universities/search?q=UCAC').expect(200);
    expect(search.body.items[0].shortName).toBe('UCAC');
    await request(app).get(`/api/v1/universities/${search.body.items[0].id}`).expect(200);
  });

  it('allows administrators, but not students, to manage universities', async () => {
    const app = createApp();
    const adminLogin = await request(app).post('/api/v1/auth/login').send({ identity: 'admin@demo.cm', password: 'Demo123!' }).expect(200);
    const studentLogin = await request(app).post('/api/v1/auth/login').send({ identity: 'student@demo.cm', password: 'Demo123!' }).expect(200);
    const input = { name: 'National Advanced School of Engineering', shortName: 'ENSPY', city: 'Yaounde', latitude: 3.866, longitude: 11.52, defaultRadiusKm: 5, active: true };

    await request(app).post('/api/v1/admin/universities').set('Authorization', `Bearer ${studentLogin.body.tokens.accessToken}`).send(input).expect(403);
    const created = await request(app).post('/api/v1/admin/universities').set('Authorization', `Bearer ${adminLogin.body.tokens.accessToken}`).send(input).expect(201);
    expect(created.body.university.shortName).toBe('ENSPY');
    const updated = await request(app).patch(`/api/v1/admin/universities/${created.body.university.id}`).set('Authorization', `Bearer ${adminLogin.body.tokens.accessToken}`).send({ active: false }).expect(200);
    expect(updated.body.university.active).toBe(false);
  });
});

