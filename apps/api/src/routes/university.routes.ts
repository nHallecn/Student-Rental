import { Router } from 'express';
import { z } from 'zod';
import { getRepository } from '../data/index.js';
import { AppError } from '../lib/errors.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
const idSchema = z.string().uuid();
const universitySchema = z.object({
  name: z.string().trim().min(3).max(160),
  shortName: z.string().trim().min(2).max(30),
  city: z.string().trim().min(2).max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  defaultRadiusKm: z.number().positive().max(100),
  logoUrl: z.string().url().optional(),
  active: z.boolean().default(true),
});

router.get('/universities', async (request, response) => {
  const { q } = z.object({ q: z.string().trim().max(100).optional() }).parse(request.query);
  response.json({ items: await getRepository().listUniversities({ query: q }) });
});
router.get('/universities/search', async (request, response) => {
  const { q } = z.object({ q: z.string().trim().min(1).max(100) }).parse(request.query);
  response.json({ items: await getRepository().listUniversities({ query: q }) });
});
router.get('/universities/:id', async (request, response) => {
  const id = idSchema.parse(request.params.id);
  const university = await getRepository().findUniversityById(id);
  if (!university || !university.active) throw new AppError(404, 'UNIVERSITY_NOT_FOUND', 'University not found');
  response.json({ university });
});

router.get('/admin/universities', authenticate, requireRole('ADMIN'), async (_request, response) => {
  response.json({ items: await getRepository().listUniversities({ includeInactive: true }) });
});
router.post('/admin/universities', authenticate, requireRole('ADMIN'), async (request, response) => {
  const university = await getRepository().createUniversity(universitySchema.parse(request.body));
  await getRepository().audit(request.auth!.userId, 'UNIVERSITY_CREATED', 'university', university.id);
  response.status(201).json({ university });
});
router.patch('/admin/universities/:id', authenticate, requireRole('ADMIN'), async (request, response) => {
  const id = idSchema.parse(request.params.id);
  const input = universitySchema.partial().parse(request.body);
  const university = await getRepository().updateUniversity(id, input);
  if (!university) throw new AppError(404, 'UNIVERSITY_NOT_FOUND', 'University not found');
  await getRepository().audit(request.auth!.userId, 'UNIVERSITY_UPDATED', 'university', university.id, { fields: Object.keys(input) });
  response.json({ university });
});

export { router as universityRouter };

