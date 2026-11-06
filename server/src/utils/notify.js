import prisma from '../lib/prisma.js';

export async function notifyUser(userId, { type = 'GENERAL', title, message, link }) {
  if (!userId || !title || !message) return null;
  return prisma.notification.create({
    data: { userId, type, title, message, link: link || null },
  });
}
