import { Router } from 'express';
import { z } from 'zod';
import { getRepository } from '../data/index.js';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';
import { assertCanManageProperty, publicProperty, requireProperty, requireUnitWithProperty } from '../services/property.service.js';
import { processLocalImage, propertyImageUpload } from '../services/upload.service.js';

const router = Router();
const id = z.string().uuid();
const propertySchema = z.object({
  name: z.string().trim().min(3).max(160), propertyCategory: z.enum(['MINI_CITE', 'HOSTEL', 'APARTMENT_BUILDING', 'HOUSE', 'COMPOUND']),
  description: z.string().trim().max(5000).default(''), city: z.string().trim().min(2).max(100), neighbourhood: z.string().trim().min(2).max(120), landmark: z.string().trim().min(2).max(250), accessDetails: z.string().trim().max(1000).optional(),
  latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180), locationVisibility: z.enum(['APPROXIMATE', 'EXACT']).default('APPROXIMATE'), amenityIds: z.array(z.string().uuid()).max(50).default([]),
});
const unitSchema = z.object({
  name: z.string().trim().min(1).max(100), unitType: z.enum(['ROOM', 'MODERN_ROOM', 'STUDIO', 'APARTMENT', 'HOUSE']), description: z.string().trim().max(3000).default(''), monthlyRent: z.number().int().nonnegative(), advanceMonths: z.number().int().nonnegative().max(36), cautionAmount: z.number().int().nonnegative(), visitFee: z.number().int().nonnegative(), agentCommission: z.number().int().nonnegative(), availabilityStatus: z.enum(['AVAILABLE', 'OCCUPIED', 'AVAILABLE_SOON', 'UNCONFIRMED']), availableFrom: z.string().date().optional(),
});
const commaList = <T extends string>(schema: z.ZodType<T>) => z.preprocess((value) => typeof value === 'string' ? value.split(',').filter(Boolean) : value, z.array(schema).optional());

router.get('/amenities', async (_request, response) => response.json({ items: await getRepository().listAmenities() }));
router.get('/universities/:id/rentals', async (request, response) => {
  const universityId = id.parse(request.params.id);
  const university = await getRepository().findUniversityById(universityId);
  if (!university) throw new AppError(404, 'UNIVERSITY_NOT_FOUND', 'University not found');
  const query = z.object({ minPrice: z.coerce.number().int().nonnegative().optional(), maxPrice: z.coerce.number().int().nonnegative().optional(), type: commaList(z.enum(['ROOM', 'MODERN_ROOM', 'STUDIO', 'APARTMENT', 'HOUSE'])), distance: z.coerce.number().positive().max(100).optional(), source: z.enum(['LANDLORD', 'AGENT']).optional(), amenities: commaList(z.string().uuid()), availability: commaList(z.enum(['AVAILABLE', 'OCCUPIED', 'AVAILABLE_SOON', 'UNCONFIRMED'])), sort: z.enum(['CLOSEST', 'PRICE_LOW', 'PRICE_HIGH', 'NEWEST', 'RECENTLY_CONFIRMED']).optional(), page: z.coerce.number().int().positive().optional(), pageSize: z.coerce.number().int().positive().max(50).optional() }).parse(request.query);
  const result = await getRepository().searchRentals(universityId, { minPrice: query.minPrice, maxPrice: query.maxPrice, types: query.type, distanceKm: query.distance ?? university.defaultRadiusKm, source: query.source, amenityIds: query.amenities, availability: query.availability, sort: query.sort, page: query.page, pageSize: query.pageSize });
  response.json(result);
});

router.get('/properties/mine', authenticate, requireRole('LANDLORD', 'AGENT', 'ADMIN'), async (request, response) => response.json({ items: await getRepository().listOwnerProperties(request.auth!.userId) }));
router.post('/properties', authenticate, requireRole('LANDLORD', 'AGENT'), async (request, response) => {
  const property = await getRepository().createProperty(request.auth!.userId, propertySchema.parse(request.body));
  await getRepository().audit(request.auth!.userId, 'PROPERTY_CREATED', 'property', property.id);
  response.status(201).json({ property });
});
router.get('/properties/:id', optionalAuthenticate, async (request, response) => {
  const property = await requireProperty(id.parse(request.params.id));
  const privileged = request.auth?.role === 'ADMIN' || request.auth?.userId === property.ownerId;
  if (property.status !== 'ACTIVE' && !privileged) throw new AppError(404, 'PROPERTY_NOT_FOUND', 'Property not found');
  await getRepository().recordAnalytics(request.auth?.userId, request.header('x-anonymous-id'), 'PROPERTY_OPENED', { propertyId: property.id });
  response.json({ property: publicProperty(property, Boolean(privileged)) });
});
router.patch('/properties/:id', authenticate, requireRole('LANDLORD', 'AGENT', 'ADMIN'), async (request, response) => {
  const propertyId = id.parse(request.params.id); const property = await requireProperty(propertyId); assertCanManageProperty(request, property);
  const updated = await getRepository().updateProperty(propertyId, propertySchema.partial().parse(request.body));
  await getRepository().audit(request.auth!.userId, 'PROPERTY_UPDATED', 'property', propertyId);
  response.json({ property: updated });
});
router.delete('/properties/:id', authenticate, requireRole('LANDLORD', 'AGENT', 'ADMIN'), async (request, response) => {
  const propertyId = id.parse(request.params.id); const property = await requireProperty(propertyId); assertCanManageProperty(request, property);
  await getRepository().setPropertyStatus(propertyId, 'ARCHIVED'); await getRepository().audit(request.auth!.userId, 'PROPERTY_ARCHIVED', 'property', propertyId); response.status(204).send();
});
router.post('/properties/:id/submit', authenticate, requireRole('LANDLORD', 'AGENT'), async (request, response) => {
  const propertyId = id.parse(request.params.id); const property = await requireProperty(propertyId); assertCanManageProperty(request, property);
  if (!property.units.length) throw new AppError(400, 'UNIT_REQUIRED', 'Add at least one rental unit before submitting');
  const updated = await getRepository().setPropertyStatus(propertyId, 'PENDING_REVIEW'); await getRepository().audit(request.auth!.userId, 'PROPERTY_SUBMITTED', 'property', propertyId); response.json({ property: updated });
});

router.post('/properties/:id/images', authenticate, requireRole('LANDLORD', 'AGENT', 'ADMIN'), propertyImageUpload.single('image'), async (request, response) => {
  const propertyId = id.parse(request.params.id); const property = await requireProperty(propertyId); assertCanManageProperty(request, property);
  if (!request.file) throw new AppError(400, 'IMAGE_REQUIRED', 'Attach an image file using the image field');
  if (property.images.length >= 12) throw new AppError(400, 'IMAGE_LIMIT', 'A property can have at most 12 images');
  const urls = await processLocalImage(request.file); const image = await getRepository().addPropertyImage(propertyId, { ...urls, position: property.images.length }); response.status(201).json({ image });
});
router.post('/properties/:id/images/remote', authenticate, requireRole('LANDLORD', 'AGENT', 'ADMIN'), async (request, response) => {
  const propertyId = id.parse(request.params.id); const property = await requireProperty(propertyId); assertCanManageProperty(request, property);
  const input = z.object({ imageUrl: z.string().url(), thumbnailUrl: z.string().url().optional(), position: z.number().int().nonnegative().max(11) }).parse(request.body);
  response.status(201).json({ image: await getRepository().addPropertyImage(propertyId, input) });
});
router.delete('/properties/:propertyId/images/:imageId', authenticate, requireRole('LANDLORD', 'AGENT', 'ADMIN'), async (request, response) => {
  const propertyId = id.parse(request.params.propertyId); const property = await requireProperty(propertyId); assertCanManageProperty(request, property);
  if (!(await getRepository().deletePropertyImage(propertyId, id.parse(request.params.imageId)))) throw new AppError(404, 'IMAGE_NOT_FOUND', 'Image not found'); response.status(204).send();
});

router.get('/properties/:id/units', optionalAuthenticate, async (request, response) => { const property = await requireProperty(id.parse(request.params.id)); const privileged = request.auth?.role === 'ADMIN' || request.auth?.userId === property.ownerId; if (property.status !== 'ACTIVE' && !privileged) throw new AppError(404, 'PROPERTY_NOT_FOUND', 'Property not found'); response.json({ items: property.units }); });
router.post('/properties/:id/units', authenticate, requireRole('LANDLORD', 'AGENT', 'ADMIN'), async (request, response) => { const propertyId = id.parse(request.params.id); const property = await requireProperty(propertyId); assertCanManageProperty(request, property); const input = unitSchema.parse(request.body); response.status(201).json({ unit: await getRepository().createUnit(propertyId, input) }); });
router.patch('/units/:id', authenticate, requireRole('LANDLORD', 'AGENT', 'ADMIN'), async (request, response) => { const unitId = id.parse(request.params.id); const { property } = await requireUnitWithProperty(unitId); assertCanManageProperty(request, property); response.json({ unit: await getRepository().updateUnit(unitId, unitSchema.partial().parse(request.body)) }); });
router.delete('/units/:id', authenticate, requireRole('LANDLORD', 'AGENT', 'ADMIN'), async (request, response) => { const unitId = id.parse(request.params.id); const { property } = await requireUnitWithProperty(unitId); assertCanManageProperty(request, property); await getRepository().deleteUnit(unitId); response.status(204).send(); });
router.patch('/units/:id/availability', authenticate, requireRole('LANDLORD', 'AGENT', 'ADMIN'), async (request, response) => { const unitId = id.parse(request.params.id); const { property } = await requireUnitWithProperty(unitId); assertCanManageProperty(request, property); const input = z.object({ availabilityStatus: z.enum(['AVAILABLE', 'OCCUPIED', 'AVAILABLE_SOON', 'UNCONFIRMED']), availableFrom: z.string().date().optional() }).parse(request.body); const unit = await getRepository().updateUnit(unitId, input); await getRepository().audit(request.auth!.userId, 'AVAILABILITY_UPDATED', 'rental_unit', unitId, input); response.json({ unit }); });

router.get('/favourites', authenticate, requireRole('STUDENT'), async (request, response) => response.json({ items: await getRepository().listFavourites(request.auth!.userId) }));
router.post('/favourites/:unitId', authenticate, requireRole('STUDENT'), async (request, response) => { const unitId = id.parse(request.params.unitId); if (!(await getRepository().findUnit(unitId))) throw new AppError(404, 'UNIT_NOT_FOUND', 'Rental unit not found'); await getRepository().addFavourite(request.auth!.userId, unitId); response.status(201).json({ saved: true }); });
router.delete('/favourites/:unitId', authenticate, requireRole('STUDENT'), async (request, response) => { await getRepository().removeFavourite(request.auth!.userId, id.parse(request.params.unitId)); response.status(204).send(); });

router.post('/properties/:id/report', optionalAuthenticate, async (request, response) => { const propertyId = id.parse(request.params.id); await requireProperty(propertyId); const input = z.object({ reason: z.enum(['NO_LONGER_AVAILABLE', 'WRONG_PRICE', 'FALSE_LOCATION', 'FRAUD', 'UNDISCLOSED_FEE', 'DUPLICATE', 'INAPPROPRIATE', 'OTHER']), description: z.string().trim().max(2000).default('') }).parse(request.body); response.status(201).json({ report: await getRepository().createReport(request.auth?.userId, propertyId, input.reason, input.description) }); });
router.post('/units/:id/contact', optionalAuthenticate, async (request, response) => { const unitId = id.parse(request.params.id); const { property } = await requireUnitWithProperty(unitId); if (property.status !== 'ACTIVE') throw new AppError(404, 'UNIT_NOT_FOUND', 'Rental unit not found'); const { method } = z.object({ method: z.enum(['WHATSAPP', 'PHONE']) }).parse(request.body); await getRepository().createInquiry(request.auth?.userId, unitId, method); response.status(201).json({ contact: { method, phone: property.contactPhone } }); });
router.post('/analytics/events', optionalAuthenticate, async (request, response) => { const input = z.object({ anonymousId: z.string().max(100).optional(), eventName: z.enum(['UNIVERSITY_SELECTED', 'SEARCH_PERFORMED', 'FILTER_APPLIED', 'PROPERTY_IMPRESSION', 'PROPERTY_OPENED', 'MAP_MARKER_SELECTED', 'WHATSAPP_CONTACT_CLICKED', 'PHONE_CONTACT_CLICKED', 'PROPERTY_SAVED', 'PROPERTY_SHARED', 'PROPERTY_REPORTED', 'AVAILABILITY_UPDATED', 'LISTING_APPROVED', 'LISTING_REJECTED']), properties: z.record(z.string(), z.unknown()).default({}) }).parse(request.body); await getRepository().recordAnalytics(request.auth?.userId, input.anonymousId, input.eventName, input.properties); response.status(202).send(); });

export { router as marketplaceRouter };
