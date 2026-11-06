import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import { notifyUser } from '../utils/notify.js';
import { recordAudit } from '../utils/audit.js';
import { nextApplicationReference, paymentReference } from '../utils/refs.js';

const router = Router();

const STATUSES = [
  'SUBMITTED',
  'DOCUMENTS_VERIFIED',
  'UNDER_REVIEW',
  'CORRECTION_REQUESTED',
  'APPROVED',
  'REJECTED',
];

const listInclude = {
  service: { select: { id: true, name: true, category: true, fee: true, processingDays: true } },
  assignedOfficer: { select: { id: true, fullName: true } },
  user: { select: { id: true, fullName: true, email: true } },
  _count: { select: { documents: true, payments: true } },
};

async function loadApplicationForUser(req, id) {
  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      service: true,
      user: { select: { id: true, fullName: true, email: true, phone: true, profile: true } },
      assignedOfficer: { select: { id: true, fullName: true, email: true } },
      documents: {
        include: {
          uploadedBy: { select: { id: true, fullName: true, role: true } },
          verifiedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      statusHistory: {
        include: { changedBy: { select: { id: true, fullName: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
      payments: { orderBy: { createdAt: 'desc' } },
      assignments: {
        include: {
          officer: { select: { id: true, fullName: true } },
          assignedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
  });

  if (!application) throw new AppError(404, 'Application not found.');

  const user = req.user;
  if (user.role === 'CITIZEN' && application.userId !== user.id) {
    throw new AppError(403, 'You do not have access to this application.');
  }
  if (user.role === 'OFFICER' && application.assignedOfficerId !== user.id) {
    throw new AppError(403, 'This application is not assigned to you.');
  }
  return application;
}

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { status, search } = req.query;
    const where = {};
    if (req.user.role === 'CITIZEN') where.userId = req.user.id;
    if (req.user.role === 'OFFICER') where.assignedOfficerId = req.user.id;
    if (status && STATUSES.includes(status)) where.status = status;
    if (search) {
      where.OR = [
        { referenceNo: { contains: String(search), mode: 'insensitive' } },
        { service: { name: { contains: String(search), mode: 'insensitive' } } },
      ];
    }

    const applications = await prisma.application.findMany({
      where,
      include: listInclude,
      orderBy: { submittedAt: 'desc' },
    });
    res.json({ applications });
  })
);

const createSchema = z.object({
  serviceId: z.string().min(1),
  formData: z.record(z.string(), z.any()).optional(),
});

router.post(
  '/',
  authenticate,
  authorize('CITIZEN'),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const service = await prisma.service.findUnique({ where: { id: req.body.serviceId } });
    if (!service || !service.isActive) throw new AppError(404, 'Service is unavailable.');

    const referenceNo = await nextApplicationReference();
    const application = await prisma.application.create({
      data: {
        referenceNo,
        userId: req.user.id,
        serviceId: service.id,
        status: 'SUBMITTED',
        formData: req.body.formData || {},
        statusHistory: {
          create: { status: 'SUBMITTED', remarks: 'Application submitted by citizen.' },
        },
      },
      include: { service: true },
    });

    if (Number(service.fee) > 0) {
      await prisma.payment.create({
        data: {
          referenceNo: paymentReference(),
          userId: req.user.id,
          applicationId: application.id,
          amount: service.fee,
          status: 'PENDING',
          purpose: `${service.name} fee`,
        },
      });
    }

    await notifyUser(req.user.id, {
      type: 'STATUS_UPDATE',
      title: `Application ${referenceNo} submitted`,
      message: `Your ${service.name} application has been received. Track its progress from your dashboard.`,
      link: `/app/applications/${application.id}`,
    });
    await recordAudit(req, 'APPLICATION_SUBMITTED', 'Application', application.id, { referenceNo });

    res.status(201).json({ application });
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const application = await loadApplicationForUser(req, req.params.id);
    res.json({ application });
  })
);

router.post(
  '/:id/documents',
  authenticate,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const application = await loadApplicationForUser(req, req.params.id);
    if (req.user.role === 'OFFICER') throw new AppError(403, 'Officers cannot upload applicant documents.');
    if (!req.file) throw new AppError(400, 'Please choose a file to upload.');

    const document = await prisma.applicationDocument.create({
      data: {
        applicationId: application.id,
        uploadedById: req.user.id,
        fileName: req.file.originalname,
        filePath: `uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        documentType: req.body.documentType || 'Supporting document',
      },
    });

    if (application.assignedOfficerId) {
      await notifyUser(application.assignedOfficerId, {
        type: 'STATUS_UPDATE',
        title: `New document for ${application.referenceNo}`,
        message: `${req.user.fullName} uploaded ${document.documentType}.`,
        link: '/officer/applications',
      });
    }
    await recordAudit(req, 'DOCUMENT_UPLOADED', 'Application', application.id, {
      referenceNo: application.referenceNo,
      fileName: document.fileName,
    });

    res.status(201).json({ document });
  })
);

router.patch(
  '/:id/documents/:documentId/verify',
  authenticate,
  authorize('OFFICER', 'ADMIN'),
  validate(z.object({ isVerified: z.boolean(), remarks: z.string().max(500).optional() })),
  asyncHandler(async (req, res) => {
    const application = await loadApplicationForUser(req, req.params.id);
    const document = await prisma.applicationDocument.findFirst({
      where: { id: req.params.documentId, applicationId: application.id },
    });
    if (!document) throw new AppError(404, 'Document not found.');

    const updated = await prisma.applicationDocument.update({
      where: { id: document.id },
      data: {
        isVerified: req.body.isVerified,
        verifiedById: req.user.id,
        verifiedAt: new Date(),
      },
    });

    await notifyUser(application.userId, {
      type: 'STATUS_UPDATE',
      title: `Document ${req.body.isVerified ? 'verified' : 'flagged'} for ${application.referenceNo}`,
      message: req.body.remarks || `Your ${document.documentType} was reviewed by an officer.`,
      link: `/app/applications/${application.id}`,
    });
    await recordAudit(req, 'DOCUMENT_REVIEWED', 'ApplicationDocument', document.id, {
      referenceNo: application.referenceNo,
      isVerified: req.body.isVerified,
    });

    res.json({ document: updated });
  })
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('OFFICER', 'ADMIN'),
  validate(z.object({ status: z.enum(STATUSES), remarks: z.string().max(1000).optional() })),
  asyncHandler(async (req, res) => {
    const application = await loadApplicationForUser(req, req.params.id);
    const { status, remarks } = req.body;

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: {
        status,
        officerRemarks: remarks ?? application.officerRemarks,
        decidedAt: ['APPROVED', 'REJECTED'].includes(status) ? new Date() : application.decidedAt,
        statusHistory: {
          create: { status, remarks: remarks || null, changedById: req.user.id },
        },
      },
      include: { service: true },
    });

    const messages = {
      SUBMITTED: 'Your application has been submitted.',
      DOCUMENTS_VERIFIED: 'Your documents have been verified.',
      UNDER_REVIEW: 'Your application is now under officer review.',
      CORRECTION_REQUESTED: 'A correction is required. Please review the officer remarks and resubmit.',
      APPROVED: 'Congratulations! Your application has been approved.',
      REJECTED: 'Your application has been rejected. Please review the officer remarks.',
    };

    await notifyUser(application.userId, {
      type: 'STATUS_UPDATE',
      title: `${application.referenceNo}: ${status.replaceAll('_', ' ').toLowerCase()}`,
      message: remarks || messages[status],
      link: `/app/applications/${application.id}`,
    });

    if (status === 'CORRECTION_REQUESTED') {
      await prisma.dueDate.create({
        data: {
          userId: application.userId,
          type: 'APPLICATION_ACTION',
          title: `Action required for ${application.referenceNo}`,
          description: remarks || 'Upload the requested corrections to continue processing.',
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          referenceId: application.referenceNo,
        },
      });
    }

    if (status === 'APPROVED' || status === 'REJECTED') {
      await prisma.dueDate.updateMany({
        where: { referenceId: application.referenceNo, type: 'APPLICATION_ACTION', isCompleted: false },
        data: { isCompleted: true },
      });
    }

    await recordAudit(req, `APPLICATION_${status}`, 'Application', application.id, {
      referenceNo: application.referenceNo,
    });

    res.json({ application: updated });
  })
);

router.post(
  '/:id/resubmit',
  authenticate,
  authorize('CITIZEN'),
  validate(z.object({ remarks: z.string().max(500).optional() })),
  asyncHandler(async (req, res) => {
    const application = await loadApplicationForUser(req, req.params.id);
    if (application.userId !== req.user.id) throw new AppError(403, 'You do not own this application.');
    if (application.status !== 'CORRECTION_REQUESTED') {
      throw new AppError(400, 'This application is not awaiting corrections.');
    }

    const updated = await prisma.application.update({
      where: { id: application.id },
      data: {
        status: 'SUBMITTED',
        statusHistory: {
          create: {
            status: 'SUBMITTED',
            remarks: req.body.remarks || 'Citizen resubmitted the application with corrections.',
            changedById: req.user.id,
          },
        },
      },
      include: { service: true },
    });

    await prisma.dueDate.updateMany({
      where: { referenceId: application.referenceNo, type: 'APPLICATION_ACTION', isCompleted: false },
      data: { isCompleted: true },
    });

    if (application.assignedOfficerId) {
      await notifyUser(application.assignedOfficerId, {
        type: 'STATUS_UPDATE',
        title: `${application.referenceNo} resubmitted`,
        message: 'The citizen has resubmitted the application with corrections.',
        link: `/officer/applications/${application.id}`,
      });
    }
    await recordAudit(req, 'APPLICATION_RESUBMITTED', 'Application', application.id, {
      referenceNo: application.referenceNo,
    });

    res.json({ application: updated });
  })
);

router.post(
  '/:id/assign',
  authenticate,
  authorize('ADMIN'),
  validate(z.object({ officerId: z.string().min(1) })),
  asyncHandler(async (req, res) => {
    const application = await prisma.application.findUnique({ where: { id: req.params.id } });
    if (!application) throw new AppError(404, 'Application not found.');

    const officer = await prisma.user.findUnique({ where: { id: req.body.officerId } });
    if (!officer || officer.role !== 'OFFICER' || !officer.isActive) {
      throw new AppError(400, 'Select an active officer.');
    }

    await prisma.officerAssignment.updateMany({
      where: { applicationId: application.id, isActive: true },
      data: { isActive: false },
    });
    await prisma.officerAssignment.create({
      data: { officerId: officer.id, applicationId: application.id, assignedById: req.user.id },
    });
    const updated = await prisma.application.update({
      where: { id: application.id },
      data: { assignedOfficerId: officer.id },
      include: { service: true, assignedOfficer: { select: { id: true, fullName: true } } },
    });

    await notifyUser(officer.id, {
      type: 'STATUS_UPDATE',
      title: `Application ${application.referenceNo} assigned`,
      message: `${application.referenceNo} has been assigned to you for review.`,
      link: `/officer/applications/${application.id}`,
    });
    await recordAudit(req, 'APPLICATION_ASSIGNED', 'Application', application.id, {
      referenceNo: application.referenceNo,
      officerId: officer.id,
    });

    res.json({ application: updated });
  })
);

export default router;
