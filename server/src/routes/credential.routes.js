import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { notifyUser } from '../utils/notify.js';
import { recordAudit } from '../utils/audit.js';

const router = Router();
const TYPES = ['AADHAAR', 'DIGILOCKER', 'PROPERTY', 'LICENCE', 'DOCUMENT'];

const withEffectiveStatus = (credential) => {
  const expired =
    credential.status === 'VERIFIED' &&
    credential.expiresAt &&
    new Date(credential.expiresAt).getTime() < Date.now();
  return { ...credential, effectiveStatus: expired ? 'EXPIRED' : credential.status };
};

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const rows = await prisma.credential.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ credentials: rows.map(withEffectiveStatus) });
  })
);

const credentialSchema = z.object({
  type: z.enum(TYPES),
  title: z.string().trim().min(2).max(120),
  issuer: z.string().trim().min(2).max(120),
  credentialNumber: z.string().trim().max(80).nullable().optional(),
  issuedAt: z.coerce.date().nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

router.post(
  '/',
  authenticate,
  validate(credentialSchema),
  asyncHandler(async (req, res) => {
    const credential = await prisma.credential.create({
      data: {
        userId: req.user.id,
        type: req.body.type,
        title: req.body.title,
        issuer: req.body.issuer,
        credentialNumber: req.body.credentialNumber || null,
        issuedAt: req.body.issuedAt || null,
        expiresAt: req.body.expiresAt || null,
        metadata: req.body.metadata || {},
        status: 'PENDING',
      },
    });
    await recordAudit(req, 'CREDENTIAL_ADDED', 'Credential', credential.id, { type: credential.type });
    res.status(201).json({ credential: withEffectiveStatus(credential) });
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const credential = await prisma.credential.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { verifications: { orderBy: { verifiedAt: 'desc' } } },
    });
    if (!credential) throw new AppError(404, 'Credential not found.');
    res.json({ credential: withEffectiveStatus(credential) });
  })
);

router.patch(
  '/:id',
  authenticate,
  validate(credentialSchema.partial()),
  asyncHandler(async (req, res) => {
    const existing = await prisma.credential.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) throw new AppError(404, 'Credential not found.');

    const credential = await prisma.credential.update({
      where: { id: existing.id },
      data: req.body,
    });
    await recordAudit(req, 'CREDENTIAL_UPDATED', 'Credential', credential.id);
    res.json({ credential: withEffectiveStatus(credential) });
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.credential.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) throw new AppError(404, 'Credential not found.');
    await prisma.credential.delete({ where: { id: existing.id } });
    await recordAudit(req, 'CREDENTIAL_REMOVED', 'Credential', existing.id);
    res.json({ message: 'Credential removed from wallet.' });
  })
);

router.post(
  '/:id/verify',
  authenticate,
  asyncHandler(async (req, res) => {
    const existing = await prisma.credential.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) throw new AppError(404, 'Credential not found.');
    if (existing.status === 'VERIFIED') {
      throw new AppError(400, 'This credential is already verified.');
    }

    const expired = existing.expiresAt && new Date(existing.expiresAt).getTime() < Date.now();
    const status = expired ? 'EXPIRED' : 'VERIFIED';

    const [, credential] = await prisma.$transaction([
      prisma.credentialVerification.create({
        data: {
          credentialId: existing.id,
          status,
          method: 'SIMULATED',
          remarks: expired
            ? 'Document is past its expiry date.'
            : 'Simulated verification completed for prototype.',
        },
      }),
      prisma.credential.update({
        where: { id: existing.id },
        data: { status, verifiedAt: new Date() },
        include: { verifications: { orderBy: { verifiedAt: 'desc' } } },
      }),
    ]);

    await notifyUser(req.user.id, {
      type: 'GENERAL',
      title: `${existing.title} verification ${status.toLowerCase()}`,
      message:
        'Simulated verification completed. This prototype does not connect to UIDAI, DigiLocker or other live registries.',
      link: '/app/wallet',
    });
    await recordAudit(req, 'CREDENTIAL_VERIFIED', 'Credential', existing.id, {
      status,
      method: 'SIMULATED',
    });

    res.json({
      message: 'Simulated verification completed.',
      credential: withEffectiveStatus(credential),
    });
  })
);

export default router;
