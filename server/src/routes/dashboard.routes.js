import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { asyncHandler } from '../utils/http.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const now = new Date();

    const [
      totalApplications,
      pendingApplications,
      approvedApplications,
      pendingPayments,
      completedPayments,
      credentialCount,
      verifiedCredentialCount,
      unreadNotifications,
      upcomingDueDates,
      recentApplications,
      recentActivity,
      recentNotifications,
    ] = await Promise.all([
      prisma.application.count({ where: { userId } }),
      prisma.application.count({
        where: { userId, status: { in: ['SUBMITTED', 'DOCUMENTS_VERIFIED', 'UNDER_REVIEW', 'CORRECTION_REQUESTED'] } },
      }),
      prisma.application.count({ where: { userId, status: 'APPROVED' } }),
      prisma.payment.count({ where: { userId, status: 'PENDING' } }),
      prisma.payment.count({ where: { userId, status: 'SUCCESS' } }),
      prisma.credential.count({ where: { userId } }),
      prisma.credential.count({ where: { userId, status: 'VERIFIED' } }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.dueDate.findMany({
        where: { userId, isCompleted: false, dueDate: { gte: now } },
        orderBy: { dueDate: 'asc' },
        take: 5,
      }),
      prisma.application.findMany({
        where: { userId },
        include: { service: { select: { name: true, category: true } } },
        orderBy: { submittedAt: 'desc' },
        take: 5,
      }),
      prisma.applicationStatusHistory.findMany({
        where: { application: { userId } },
        include: { application: { select: { id: true, referenceNo: true, service: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 6,
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),
    ]);

    const pendingAmount = await prisma.payment.aggregate({
      where: { userId, status: 'PENDING' },
      _sum: { amount: true },
    });
    const paidAmount = await prisma.payment.aggregate({
      where: { userId, status: 'SUCCESS' },
      _sum: { amount: true },
    });

    res.json({
      stats: {
        totalApplications,
        pendingApplications,
        approvedApplications,
        pendingPayments,
        completedPayments,
        pendingAmount: Number(pendingAmount._sum.amount || 0),
        paidAmount: Number(paidAmount._sum.amount || 0),
        credentialCount,
        verifiedCredentialCount,
        unreadNotifications,
      },
      upcomingDueDates,
      recentApplications,
      recentActivity,
      recentNotifications,
    });
  })
);

export default router;
