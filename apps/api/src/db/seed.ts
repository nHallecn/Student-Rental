import { hash } from 'bcryptjs';
import { env } from '../config/env.js';
import { closePool, getPool } from './pool.js';

const universities = [
  { name: 'University of Yaounde I', shortName: 'UY1', city: 'Yaounde', latitude: 3.8619, longitude: 11.5007, radius: 5 },
  { name: 'Catholic University of Central Africa', shortName: 'UCAC', city: 'Yaounde', latitude: 3.8876, longitude: 11.5126, radius: 5 },
  { name: 'University of Yaounde II', shortName: 'UY2', city: 'Soa', latitude: 3.9694, longitude: 11.5878, radius: 7 },
];
const amenities: Record<string, string[]> = {
  Water: ['Borehole', 'CAMWATER', 'Shared water source'], Electricity: ['ENEO', 'Prepaid meter', 'Shared meter', 'Backup power'],
  Room: ['Private toilet', 'Kitchen', 'Balcony', 'Furnished'], Building: ['Security gate', 'Parking', 'Wi-Fi'], Access: ['Tarred road', 'Car accessible', 'Motorbike accessible'],
};

if (!env.SEED_ADMIN_PASSWORD) throw new Error('Set SEED_ADMIN_PASSWORD to at least 12 characters before running the seed');
const client = await getPool().connect();
try {
  await client.query('BEGIN');
  const passwordHash = await hash(env.SEED_ADMIN_PASSWORD, 12);
  await client.query(`INSERT INTO users(first_name,last_name,email,password_hash,role,phone_verified) VALUES('Platform','Administrator',$1,$2,'ADMIN',true)
    ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash,role='ADMIN',suspended_at=NULL,updated_at=now()`, [env.SEED_ADMIN_EMAIL.toLowerCase(), passwordHash]);
  for (const university of universities) {
    const existing = await client.query<{ id: string }>('SELECT id FROM universities WHERE lower(short_name)=lower($1) AND lower(city)=lower($2)', [university.shortName, university.city]);
    if (existing.rows[0]) await client.query('UPDATE universities SET name=$2,latitude=$3,longitude=$4,default_radius_km=$5,active=true,updated_at=now() WHERE id=$1', [existing.rows[0].id, university.name, university.latitude, university.longitude, university.radius]);
    else await client.query('INSERT INTO universities(name,short_name,city,latitude,longitude,default_radius_km) VALUES($1,$2,$3,$4,$5,$6)', [university.name, university.shortName, university.city, university.latitude, university.longitude, university.radius]);
  }
  for (const [category, names] of Object.entries(amenities)) for (const name of names) await client.query('INSERT INTO amenities(name,category) VALUES($1,$2) ON CONFLICT(name) DO UPDATE SET category=excluded.category,active=true', [name, category]);
  await client.query('COMMIT');
  console.info(`Seeded administrator ${env.SEED_ADMIN_EMAIL}, ${universities.length} universities and ${Object.values(amenities).flat().length} amenities`);
} catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); await closePool(); }

