import { env } from '../config/env.js';
import { getRepository } from '../data/index.js';

export function startAvailabilityMaintenance() {
  const run = async () => {
    try {
      const downgraded = await getRepository().downgradeStaleUnits(env.AVAILABILITY_STALE_DAYS);
      if (downgraded) console.info(`Downgraded ${downgraded} stale rental units`);
    } catch (error) { console.error('Availability maintenance failed', error); }
  };
  const timer = setInterval(run, 24 * 60 * 60 * 1000);
  timer.unref();
  return timer;
}

