import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/http.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, authorize('OFFICER'));

router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const officerId = req.user.id;

    const [assigned, pending, approved, corrections, recentApplications, recentActivity, unread] =
      await Promise.all([
        prisma.application.count({ where: { assignedOfficerId: officerId } }),
        prisma.application.count({
          where: {
            assignedOfficerId: officerId,
            status: { in: ['SUBMITTED', 'DOCUMENTS_VERIFIED', 'UNDER_REVIEW'] },
          },
        }),
        prisma.application.count({ where: { assignedOfficerId: officerId, status: 'APPROVED' } }),
        prisma.application.count({ where: { assignedOfficerId: officerId, status: 'CORRECTION_REQUESTED' } }),
        prisma.application.findMany({
          where: { assignedOfficerId: officerId },
          include: {
            user: { select: { id: true, fullName: true } },
            service: { select: { name: true, category: true } },
          },
          orderBy: { submittedAt: 'desc' },
          take: 6,
        }),
        prisma.applicationStatusHistory.findMany({
          where: { changedById: officerId },
          include: { application: { select: { id: true, referenceNo: true } } },
          orderBy: { createdAt: 'desc' },
          take: 6,
        }),
        prisma.notification.count({ where: { userId: officerId, isRead: false } }),
      ]);

    res.json({
      stats: { assigned, pending, approved, corrections, unread },
      recentApplications,
      recentActivity,
    });
  })
);

router.get(
  '/applications',
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const where = { assignedOfficerId: req.user.id };
    if (status) where.status = status;
    const applications = await prisma.application.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        service: { select: { id: true, name: true, category: true, fee: true } },
        _count: { select: { documents: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
    res.json({ applications });
  })
);

export default router;
