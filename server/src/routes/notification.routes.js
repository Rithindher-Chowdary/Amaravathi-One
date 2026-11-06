import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { recordAudit } from '../utils/audit.js';

const router = Router();
const TYPES = ['DUE_DATE', 'STATUS_UPDATE', 'PAYMENT', 'GENERAL'];

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const unread = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    res.json({ notifications, unread });
  })
);

router.get(
  '/manage/all',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      include: { user: { select: { id: true, fullName: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ notifications });
  })
);

router.patch(
  '/:id/read',
  authenticate,
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!notification) throw new AppError(404, 'Notification not found.');
    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });
    res.json({ notification: updated });
  })
);

router.post(
  '/read-all',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'All notifications marked as read.', updated: result.count });
  })
);

const createSchema = z.object({
  userId: z.string().optional(),
  broadcast: z.boolean().optional(),
  type: z.enum(TYPES).default('GENERAL'),
  title: z.string().trim().min(3).max(140),
  message: z.string().trim().min(3).max(1000),
  link: z.string().trim().max(200).optional(),
});

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { userId, broadcast, type, title, message, link } = req.body;

    if (broadcast) {
      const citizens = await prisma.user.findMany({
        where: { role: 'CITIZEN', isActive: true },
        select: { id: true },
      });
      await prisma.notification.createMany({
        data: citizens.map((citizen) => ({ userId: citizen.id, type, title, message, link: link || null })),
      });
      await recordAudit(req, 'NOTIFICATION_BROADCAST', 'Notification', null, {
        recipients: citizens.length,
        title,
      });
      return res.status(201).json({ message: `Notification sent to ${citizens.length} citizens.`, count: citizens.length });
    }

    if (!userId) throw new AppError(400, 'Choose a recipient or enable broadcast.');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'Recipient not found.');

    const notification = await prisma.notification.create({
      data: { userId, type, title, message, link: link || null },
    });
    await recordAudit(req, 'NOTIFICATION_CREATED', 'Notification', notification.id, { userId, title });
    res.status(201).json({ notification });
  })
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.notification.delete({ where: { id: req.params.id } });
    await recordAudit(req, 'NOTIFICATION_DELETED', 'Notification', req.params.id);
    res.json({ message: 'Notification deleted.' });
  })
);

export default router;
