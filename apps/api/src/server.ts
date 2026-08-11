import { createApp } from './app.js';
import { env } from './config/env.js';
import { closePool } from './db/pool.js';
import { startAvailabilityMaintenance } from './services/availability.service.js';

const app = createApp();
const availabilityTimer = startAvailabilityMaintenance();

const server = app.listen(env.PORT, () => {
  console.info(`Student Rental API listening on ${env.API_PUBLIC_URL} (${env.DEMO_MODE ? 'demo' : 'postgres'} mode)`);
});

function shutdown(signal: string) {
  console.info(`${signal} received; shutting down`);
  clearInterval(availabilityTimer);
  server.close(async (error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    await closePool();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
