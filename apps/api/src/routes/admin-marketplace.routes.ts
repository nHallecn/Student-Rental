import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { getRepository } from '../data/index.js';
import { AppError } from '../lib/errors.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { requireProperty } from '../services/property.service.js';

const router = Router();
const id = z.string().uuid();
router.use('/admin', authenticate, requireRole('ADMIN'));

router.get('/dashboard/owner', authenticate, requireRole('LANDLORD', 'AGENT'), async (request, response) => response.json({ dashboard: await getRepository().getOwnerDashboard(request.auth!.userId, env.AVAILABILITY_REMINDER_DAYS) }));

router.get('/admin/properties/pending', async (_request, response) => response.json({ items: await getRepository().listPendingProperties() }));
router.get('/admin/properties', async (_request, response) => response.json({ items: await getRepository().listAllProperties() }));
router.patch('/admin/properties/:id/review', async (request, response) => {
  const propertyId = id.parse(request.params.id); await requireProperty(propertyId);
  const input = z.object({ decision: z.enum(['APPROVE', 'NEEDS_CHANGES', 'REJECT', 'SUSPEND', 'HIDE']), notes: z.string().trim().max(3000).optional() }).parse(request.body);
  const status = { APPROVE: 'ACTIVE', NEEDS_CHANGES: 'NEEDS_CHANGES', REJECT: 'REJECTED', SUSPEND: 'SUSPENDED', HIDE: 'SUSPENDED' }[input.decision] as 'ACTIVE' | 'NEEDS_CHANGES' | 'REJECTED' | 'SUSPENDED';
  const property = await getRepository().setPropertyStatus(propertyId, status, input.notes);
  await getRepository().audit(request.auth!.userId, `LISTING_${input.decision}`, 'property', propertyId, { notes: input.notes });
  await getRepository().recordAnalytics(request.auth!.userId, undefined, input.decision === 'APPROVE' ? 'LISTING_APPROVED' : 'LISTING_REJECTED', { propertyId });
  response.json({ property });
});
router.patch('/admin/properties/:id/verify', async (request, response) => {
  const propertyId = id.parse(request.params.id); await requireProperty(propertyId); const { verificationStatus } = z.object({ verificationStatus: z.enum(['UNVERIFIED', 'PHONE_VERIFIED', 'PROPERTY_VERIFIED', 'REJECTED']) }).parse(request.body);
  const property = await getRepository().setPropertyVerification(propertyId, verificationStatus); await getRepository().audit(request.auth!.userId, 'PROPERTY_VERIFICATION_UPDATED', 'property', propertyId, { verificationStatus }); response.json({ property });
});
router.get('/admin/reports', async (_request, response) => response.json({ items: await getRepository().listReports() }));
router.patch('/admin/reports/:id', async (request, response) => { const reportId = id.parse(request.params.id); const input = z.object({ status: z.enum(['IN_REVIEW', 'RESOLVED', 'DISMISSED']), notes: z.string().trim().max(3000).optional() }).parse(request.body); const report = await getRepository().resolveReport(reportId, request.auth!.userId, input.status, input.notes); if (!report) throw new AppError(404, 'REPORT_NOT_FOUND', 'Report not found'); await getRepository().audit(request.auth!.userId, 'REPORT_UPDATED', 'property_report', reportId, input); response.json({ report }); });
router.get('/admin/users', async (_request, response) => response.json({ items: await getRepository().listUsers() }));
router.patch('/admin/users/:id/suspension', async (request, response) => { const userId = id.parse(request.params.id); if (userId === request.auth!.userId) throw new AppError(400, 'SELF_SUSPENSION', 'Administrators cannot suspend their own account'); const { suspended } = z.object({ suspended: z.boolean() }).parse(request.body); const user = await getRepository().setUserSuspended(userId, suspended); if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found'); await getRepository().audit(request.auth!.userId, suspended ? 'USER_SUSPENDED' : 'USER_RESTORED', 'user', userId); response.json({ user }); });
router.get('/admin/stats', async (_request, response) => response.json({ stats: await getRepository().getMarketplaceStats(env.AVAILABILITY_STALE_DAYS) }));
router.post('/admin/availability/sweep', async (request, response) => { const downgraded = await getRepository().downgradeStaleUnits(env.AVAILABILITY_STALE_DAYS); await getRepository().audit(request.auth!.userId, 'AVAILABILITY_STALE_SWEEP', 'rental_unit', undefined, { downgraded }); response.json({ downgraded }); });

export { router as adminMarketplaceRouter };
