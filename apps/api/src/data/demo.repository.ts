import { randomUUID } from 'node:crypto';
import { hashSync } from 'bcryptjs';
import type { CoreRepository, NewUser, OtpRecord, RefreshSessionRecord, UniversityInput, UniversityRecord, UserRecord } from './types.js';

const now = () => new Date().toISOString();

export class DemoRepository implements CoreRepository {
  private readonly users: UserRecord[];
  private readonly sessions: RefreshSessionRecord[] = [];
  private readonly otps: OtpRecord[] = [];
  private readonly universities: UniversityRecord[];
  readonly auditEntries: Array<Record<string, unknown>> = [];

  constructor() {
    const createdAt = now();
    const sharedPassword = hashSync('Demo123!', 10);
    this.users = [
      { id: '10000000-0000-4000-8000-000000000001', firstName: 'Amina', lastName: 'Student', phone: '+237670000001', email: 'student@demo.cm', passwordHash: sharedPassword, role: 'STUDENT', phoneVerified: true, createdAt, updatedAt: createdAt },
      { id: '10000000-0000-4000-8000-000000000002', firstName: 'Grace', lastName: 'Landlord', phone: '+237670000002', email: 'landlord@demo.cm', passwordHash: sharedPassword, role: 'LANDLORD', phoneVerified: true, createdAt, updatedAt: createdAt },
      { id: '10000000-0000-4000-8000-000000000003', firstName: 'Paul', lastName: 'Agent', phone: '+237670000003', email: 'agent@demo.cm', passwordHash: sharedPassword, role: 'AGENT', phoneVerified: true, createdAt, updatedAt: createdAt },
      { id: '10000000-0000-4000-8000-000000000004', firstName: 'Marie', lastName: 'Admin', phone: '+237670000004', email: 'admin@demo.cm', passwordHash: sharedPassword, role: 'ADMIN', phoneVerified: true, createdAt, updatedAt: createdAt },
    ];
    this.universities = [
      { id: '20000000-0000-4000-8000-000000000001', name: 'University of Yaounde I', shortName: 'UY1', city: 'Yaounde', latitude: 3.8619, longitude: 11.5007, defaultRadiusKm: 5, active: true, createdAt, updatedAt: createdAt },
      { id: '20000000-0000-4000-8000-000000000002', name: 'Catholic University of Central Africa', shortName: 'UCAC', city: 'Yaounde', latitude: 3.8876, longitude: 11.5126, defaultRadiusKm: 5, active: true, createdAt, updatedAt: createdAt },
      { id: '20000000-0000-4000-8000-000000000003', name: 'University of Yaounde II', shortName: 'UY2', city: 'Soa', latitude: 3.9694, longitude: 11.5878, defaultRadiusKm: 7, active: true, createdAt, updatedAt: createdAt },
    ];
  }

  async findUserById(id: string) { return this.users.find((user) => user.id === id); }
  async findUserByIdentity(identity: string) {
    const normalized = identity.trim().toLowerCase();
    return this.users.find((user) => user.email?.toLowerCase() === normalized || user.phone === identity.trim());
  }
  async createUser(input: NewUser) {
    const timestamp = now();
    const user: UserRecord = { id: randomUUID(), ...input, phoneVerified: false, createdAt: timestamp, updatedAt: timestamp };
    this.users.push(user);
    return user;
  }
  async setPhoneVerified(userId: string) {
    const user = this.users.find((candidate) => candidate.id === userId);
    if (!user) throw new Error('User not found');
    user.phoneVerified = true;
    user.updatedAt = now();
    return user;
  }
  async createRefreshSession(input: Omit<RefreshSessionRecord, 'id' | 'createdAt'>) {
    const session = { id: randomUUID(), createdAt: now(), ...input };
    this.sessions.push(session);
    return session;
  }
  async findRefreshSession(tokenHash: string) { return this.sessions.find((session) => session.tokenHash === tokenHash); }
  async revokeRefreshSession(tokenHash: string) {
    const session = this.sessions.find((candidate) => candidate.tokenHash === tokenHash);
    if (session) session.revokedAt = now();
  }
  async createOtp(input: Omit<OtpRecord, 'id' | 'createdAt'>) {
    const otp = { id: randomUUID(), createdAt: now(), ...input };
    this.otps.push(otp);
    return otp;
  }
  async findLatestOtp(identity: string, purpose: string) {
    return this.otps.filter((otp) => otp.identity === identity && otp.purpose === purpose).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }
  async consumeOtp(id: string) {
    const otp = this.otps.find((candidate) => candidate.id === id);
    if (otp) otp.consumedAt = now();
  }
  async listUniversities(options: { query?: string; includeInactive?: boolean } = {}) {
    const query = options.query?.trim().toLowerCase();
    return this.universities.filter((university) => {
      if (!options.includeInactive && !university.active) return false;
      if (!query) return true;
      return `${university.name} ${university.shortName} ${university.city}`.toLowerCase().includes(query);
    });
  }
  async findUniversityById(id: string) { return this.universities.find((university) => university.id === id); }
  async createUniversity(input: UniversityInput) {
    const timestamp = now();
    const university = { id: randomUUID(), ...input, createdAt: timestamp, updatedAt: timestamp };
    this.universities.push(university);
    return university;
  }
  async updateUniversity(id: string, input: Partial<UniversityInput>) {
    const university = this.universities.find((candidate) => candidate.id === id);
    if (!university) return undefined;
    Object.assign(university, input, { updatedAt: now() });
    return university;
  }
  async audit(actorId: string | undefined, action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) {
    this.auditEntries.push({ id: randomUUID(), actorId, action, entityType, entityId, metadata, createdAt: now() });
  }
}

