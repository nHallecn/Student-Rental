import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('API foundation', () => {
  it('reports service health and current persistence mode', async () => {
    const response = await request(createApp()).get('/health').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'student-rental-api',
      mode: 'demo',
    });
    expect(response.headers).toHaveProperty('x-request-id');
  });

  it('returns the stable error envelope for unknown routes', async () => {
    const response = await request(createApp()).get('/does-not-exist').expect(404);

    expect(response.body.error).toMatchObject({
      code: 'NOT_FOUND',
      message: 'No route matches GET /does-not-exist',
    });
    expect(response.body.error.requestId).toBeTruthy();
  });
});

