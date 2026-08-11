import type { Request } from 'express';
import type { PropertyDetails } from '@student-rental/contracts';
import { getRepository } from '../data/index.js';
import { AppError } from '../lib/errors.js';

export async function requireProperty(propertyId: string) {
  const property = await getRepository().findPropertyDetails(propertyId);
  if (!property) throw new AppError(404, 'PROPERTY_NOT_FOUND', 'Property not found');
  return property;
}

export function assertCanManageProperty(request: Request, property: PropertyDetails) {
  if (!request.auth || (request.auth.role !== 'ADMIN' && request.auth.userId !== property.ownerId)) throw new AppError(403, 'FORBIDDEN', 'You cannot manage this property');
}

export async function requireUnitWithProperty(unitId: string) {
  const unit = await getRepository().findUnit(unitId);
  if (!unit) throw new AppError(404, 'UNIT_NOT_FOUND', 'Rental unit not found');
  const property = await requireProperty(unit.propertyId);
  return { unit, property };
}

export function publicProperty(property: PropertyDetails, privileged: boolean): PropertyDetails {
  if (privileged) return { ...property };
  const { reviewNotes: _reviewNotes, ...visible } = property;
  if (property.locationVisibility === 'EXACT') return { ...visible };
  return { ...visible, latitude: property.latitude + 0.0014, longitude: property.longitude - 0.0012 };
}
