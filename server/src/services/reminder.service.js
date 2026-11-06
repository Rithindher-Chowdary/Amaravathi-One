import prisma from '../lib/prisma.js';
import { notifyUser } from '../utils/notify.js';

export async function runDueDateReminders({ userId, withinDays = 7 } = {}) {
  const now = new Date();
  const until = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);

  const where = {
    isCompleted: false,
    reminderSentAt: null,
    dueDate: { gte: now, lte: until },
  };
  if (userId) where.userId = userId;

  const dueDates = await prisma.dueDate.findMany({ where, orderBy: { dueDate: 'asc' } });
  let sent = 0;

  for (const item of dueDates) {
    const amount = item.amount
      ? ` Amount due: ₹${Number(item.amount).toLocaleString('en-IN')}.`
      : '';
    await notifyUser(item.userId, {
      type: 'DUE_DATE',
      title: `${item.title} due soon`,
      message: `Your ${item.title} is due on ${new Date(item.dueDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}.${amount} Please complete it before the deadline.`,
      link: '/app/notifications',
    });
    await prisma.dueDate.update({
      where: { id: item.id },
      data: { reminderSentAt: new Date() },
    });
    sent += 1;
  }

  return sent;
}
