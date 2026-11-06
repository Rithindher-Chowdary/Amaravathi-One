import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { recordAudit } from '../utils/audit.js';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const [
      citizenCount,
      officerCount,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      unassigned,
      recentApplications,
      recentActivity,
      statusGroups,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'CITIZEN' } }),
      prisma.user.count({ where: { role: 'OFFICER' } }),
      prisma.application.count(),
      prisma.application.count({ where: { status: { in: ['SUBMITTED', 'DOCUMENTS_VERIFIED', 'UNDER_REVIEW', 'CORRECTION_REQUESTED'] } } }),
      prisma.application.count({ where: { status: 'APPROVED' } }),
      prisma.application.count({ where: { status: 'REJECTED' } }),
      prisma.application.count({ where: { assignedOfficerId: null } }),
      prisma.application.findMany({
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          service: { select: { name: true, category: true } },
        },
        orderBy: { submittedAt: 'desc' },
        take: 6,
      }),
      prisma.auditLog.findMany({
        include: { user: { select: { id: true, fullName: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.application.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const [received, outstanding] = await Promise.all([
      prisma.payment.aggregate({ where: { status: 'SUCCESS' }, _sum: { amount: true }, _count: { _all: true } }),
      prisma.payment.aggregate({ where: { status: 'PENDING' }, _sum: { amount: true }, _count: { _all: true } }),
    ]);

    res.json({
      stats: {
        citizenCount,
        officerCount,
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        unassigned,
        paymentsReceived: Number(received._sum.amount || 0),
        successfulPayments: received._count._all,
        outstandingAmount: Number(outstanding._sum.amount || 0),
        pendingPayments: outstanding._count._all,
      },
      statusGroups: statusGroups.map((row) => ({ status: row.status, count: row._count._all })),
      recentApplications,
      recentActivity,
    });
  })
);

router.get(
  '/citizens',
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    const where = { role: 'CITIZEN' };
    if (search) {
      where.OR = [
        { fullName: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search) } },
      ];
    }
    const citizens = await prisma.user.findMany({
      where,
      include: {
        profile: true,
        _count: { select: { applications: true, credentials: true, payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ citizens });
  })
);

router.patch(
  '/citizens/:id',
  validate(
    z.object({
      isActive: z.boolean().optional(),
      role: z.enum(['CITIZEN', 'OFFICER', 'ADMIN']).optional(),
    })
  ),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.user.id && (req.body.isActive === false || req.body.role)) {
      throw new AppError(400, 'You cannot deactivate or change the role of your own account.');
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: req.body,
      include: { profile: true },
    });
    await recordAudit(req, 'CITIZEN_UPDATED', 'User', user.id, req.body);
    res.json({ user });
  })
);

router.get(
  '/officers',
  asyncHandler(async (req, res) => {
    const officers = await prisma.user.findMany({
      where: { role: 'OFFICER' },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        _count: { select: { assignedApplications: true } },
      },
      orderBy: { fullName: 'asc' },
    });
    res.json({ officers });
  })
);

router.get(
  '/applications',
  asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { referenceNo: { contains: String(search), mode: 'insensitive' } },
        { user: { fullName: { contains: String(search), mode: 'insensitive' } } },
        { service: { name: { contains: String(search), mode: 'insensitive' } } },
      ];
    }
    const applications = await prisma.application.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        service: { select: { id: true, name: true, category: true, fee: true } },
        assignedOfficer: { select: { id: true, fullName: true } },
        _count: { select: { documents: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });
    res.json({ applications });
  })
);

router.get(
  '/payments',
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const where = status ? { status } : {};
    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        application: { select: { id: true, referenceNo: true, service: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ payments });
  })
);

router.get(
  '/reports',
  asyncHandler(async (req, res) => {
    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const [statusGroups, paymentGroups, services, payments] = await Promise.all([
      prisma.application.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.payment.groupBy({ by: ['status'], _count: { _all: true }, _sum: { amount: true } }),
      prisma.service.findMany({
        include: { _count: { select: { applications: true } } },
        orderBy: { applications: { _count: 'desc' } },
        take: 8,
      }),
      prisma.payment.findMany({
        where: { status: 'SUCCESS', paidAt: { gte: since } },
        select: { amount: true, paidAt: true },
      }),
    ]);

    const months = [];
    for (let i = 0; i < 6; i += 1) {
      const date = new Date(since);
      date.setMonth(since.getMonth() + i);
      months.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        amount: 0,
      });
    }
    for (const payment of payments) {
      const paidAt = new Date(payment.paidAt);
      const key = `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, '0')}`;
      const bucket = months.find((month) => month.key === key);
      if (bucket) bucket.amount += Number(payment.amount);
    }

    res.json({
      applicationsByStatus: statusGroups.map((row) => ({ status: row.status, count: row._count._all })),
      paymentsByStatus: paymentGroups.map((row) => ({
        status: row.status,
        count: row._count._all,
        amount: Number(row._sum.amount || 0),
      })),
      servicePopularity: services.map((service) => ({
        name: service.name,
        category: service.category,
        applications: service._count.applications,
      })),
      revenueByMonth: months,
    });
  })
);

router.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { id: true, fullName: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 150,
    });
    res.json({ logs });
  })
);

export default router;
