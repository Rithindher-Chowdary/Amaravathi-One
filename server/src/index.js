import app from './app.js';
import prisma from './lib/prisma.js';
import { env } from './config/env.js';
import { runDueDateReminders } from './services/reminder.service.js';

const server = app.listen(env.port, () => {
  console.log(`Amaravati One API running on http://localhost:${env.port}`);
});

const reminderTimer = setInterval(() => {
  runDueDateReminders()
    .then((count) => {
      if (count > 0) console.log(`[reminders] Generated ${count} due-date reminder(s).`);
    })
    .catch((error) => console.error('[reminders] Failed:', error.message));
}, 24 * 60 * 60 * 1000);
reminderTimer.unref();

async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
