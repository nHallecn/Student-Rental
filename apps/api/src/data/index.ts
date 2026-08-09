import { env } from '../config/env.js';
import { DemoRepository } from './demo.repository.js';
import { PostgresRepository } from './postgres.repository.js';
import type { CoreRepository } from './types.js';

let repository: CoreRepository | undefined;

export function getRepository(): CoreRepository {
  repository ??= env.DEMO_MODE ? new DemoRepository() : new PostgresRepository();
  return repository;
}

export function setRepositoryForTests(value: CoreRepository | undefined) {
  repository = value;
}

