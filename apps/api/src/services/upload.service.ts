import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import sharp from 'sharp';
import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);
export const propertyImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_IMAGE_SIZE_MB * 1024 * 1024, files: 8 },
  fileFilter(_request, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) return callback(new AppError(415, 'UNSUPPORTED_IMAGE', 'Only JPEG, PNG, WebP and AVIF images are accepted'));
    callback(null, true);
  },
});

export async function processLocalImage(file: Express.Multer.File) {
  if (env.UPLOAD_DRIVER !== 'local') throw new AppError(501, 'UPLOAD_DRIVER_REQUIRED', 'Use the configured object-storage upload integration');
  const id = randomUUID();
  const outputDirectory = path.resolve(env.UPLOAD_DIR);
  await mkdir(outputDirectory, { recursive: true });
  const fullName = `${id}.webp`; const thumbnailName = `${id}-thumb.webp`;
  const pipeline = sharp(file.buffer).rotate();
  await Promise.all([
    pipeline.clone().resize({ width: 1600, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(outputDirectory, fullName)),
    pipeline.clone().resize({ width: 600, height: 450, fit: 'cover', withoutEnlargement: true }).webp({ quality: 75 }).toFile(path.join(outputDirectory, thumbnailName)),
  ]);
  return { imageUrl: `${env.API_PUBLIC_URL}/uploads/${fullName}`, thumbnailUrl: `${env.API_PUBLIC_URL}/uploads/${thumbnailName}` };
}
