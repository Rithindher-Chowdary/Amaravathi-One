import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { recordAudit } from '../utils/audit.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category, search } = req.query;
    const where = { isActive: true };
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { description: { contains: String(search), mode: 'insensitive' } },
      ];
    }
    const services = await prisma.service.findMany({
      where,
      orderBy: { name: 'asc' },
      include: { _count: { select: { applications: true } } },
    });
    res.json({ services });
  })
);

router.get(
  '/manage/all',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { applications: true } } },
    });
    res.json({ services });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { applications: true } } },
    });
    if (!service) throw new AppError(404, 'Service not found.');
    res.json({ service });
  })
);

const serviceSchema = z.object({
  code: z.string().trim().min(3).max(60),
  name: z.string().trim().min(3).max(120),
  category: z.string().trim().min(3).max(80),
  description: z.string().trim().min(10),
  eligibility: z.string().trim().min(5),
  requiredDocuments: z.array(z.string().trim().min(1)).default([]),
  fee: z.coerce.number().min(0).default(0),
  processingDays: z.coerce.number().int().min(1).max(180).default(7),
  isActive: z.boolean().optional(),
});

router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(serviceSchema),
  asyncHandler(async (req, res) => {
    const service = await prisma.service.create({
      data: {
        ...req.body,
        code: req.body.code.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
      },
    });
    await recordAudit(req, 'SERVICE_CREATED', 'Service', service.id, { name: service.name });
    res.status(201).json({ service });
  })
);

router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(serviceSchema.partial()),
  asyncHandler(async (req, res) => {
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await recordAudit(req, 'SERVICE_UPDATED', 'Service', service.id, { name: service.name });
    res.json({ service });
  })
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const service = await prisma.service.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    await recordAudit(req, 'SERVICE_DEACTIVATED', 'Service', service.id, { name: service.name });
    res.json({ message: 'Service deactivated.', service });
  })
);

export default router;
