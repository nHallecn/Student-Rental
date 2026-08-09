import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.info(`Student Rental API listening on ${env.API_PUBLIC_URL} (${env.DEMO_MODE ? 'demo' : 'postgres'} mode)`);
});

function shutdown(signal: string) {
  console.info(`${signal} received; shutting down`);
  server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

