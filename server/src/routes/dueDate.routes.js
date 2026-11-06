import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { recordAudit } from '../utils/audit.js';
import { runDueDateReminders } from '../services/reminder.service.js';

const router = Router();
const TYPES = [
  'PROPERTY_TAX',
  'LICENCE_EXPIRY',
  'APPLICATION_ACTION',
  'PAYMENT_DEADLINE',
  'DOCUMENT_EXPIRY',
];

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const dueDates = await prisma.dueDate.findMany({
      where: { userId: req.user.id },
      orderBy: { dueDate: 'asc' },
    });
    res.json({ dueDates });
  })
);

router.get(
  '/manage/all',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const dueDates = await prisma.dueDate.findMany({
      include: { user: { select: { id: true, fullName: true, email: true } } },
      orderBy: { dueDate: 'asc' },
    });
    res.json({ dueDates });
  })
);

const dueSchema = z.object({
  userId: z.string().min(1),
  type: z.enum(TYPES),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(500).optional(),
  dueDate: z.coerce.date(),
  amount: z.coerce.number().min(0).nullable().optional(),
  referenceId: z.string().trim().max(80).optional(),
});

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(dueSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.body.userId } });
    if (!user) throw new AppError(404, 'Citizen not found.');

    const dueDate = await prisma.dueDate.create({
      data: {
        userId: req.body.userId,
        type: req.body.type,
        title: req.body.title,
        description: req.body.description || null,
        dueDate: req.body.dueDate,
        amount: req.body.amount ?? null,
        referenceId: req.body.referenceId || null,
      },
    });
    await recordAudit(req, 'DUE_DATE_CREATED', 'DueDate', dueDate.id, { title: dueDate.title });
    res.status(201).json({ dueDate });
  })
);

router.post(
  '/run-reminders',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const sent = await runDueDateReminders({ withinDays: Number(req.query.days || 7) });
    await recordAudit(req, 'REMINDERS_GENERATED', 'DueDate', null, { sent });
    res.json({ message: `${sent} reminder notification(s) generated.`, sent });
  })
);

router.post(
  '/remind-me',
  authenticate,
  asyncHandler(async (req, res) => {
    const sent = await runDueDateReminders({ userId: req.user.id, withinDays: 30 });
    res.json({ message: `${sent} reminder(s) generated for your account.`, sent });
  })
);

router.patch(
  '/:id/complete',
  authenticate,
  asyncHandler(async (req, res) => {
    const where = { id: req.params.id };
    if (req.user.role !== 'ADMIN') where.userId = req.user.id;
    const dueDate = await prisma.dueDate.findFirst({ where });
    if (!dueDate) throw new AppError(404, 'Reminder not found.');
    const updated = await prisma.dueDate.update({
      where: { id: dueDate.id },
      data: { isCompleted: true },
    });
    await recordAudit(req, 'DUE_DATE_COMPLETED', 'DueDate', dueDate.id);
    res.json({ message: 'Marked as completed.', dueDate: updated });
  })
);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(
    z.object({
      type: z.enum(TYPES).optional(),
      title: z.string().trim().min(3).max(140).optional(),
      description: z.string().trim().max(500).nullable().optional(),
      dueDate: z.coerce.date().optional(),
      amount: z.coerce.number().min(0).nullable().optional(),
      isCompleted: z.boolean().optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    const dueDate = await prisma.dueDate.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await recordAudit(req, 'DUE_DATE_UPDATED', 'DueDate', dueDate.id);
    res.json({ dueDate });
  })
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    await prisma.dueDate.delete({ where: { id: req.params.id } });
    await recordAudit(req, 'DUE_DATE_DELETED', 'DueDate', req.params.id);
    res.json({ message: 'Reminder deleted.' });
  })
);

export default router;
