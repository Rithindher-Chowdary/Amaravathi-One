import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { signToken } from '../utils/tokens.js';
import { sanitizeUser } from '../utils/user.js';
import { recordAudit } from '../utils/audit.js';

const router = Router();

const registerSchema = z.object({
  fullName: z.string().trim().min(3, 'Full name must be at least 3 characters.'),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  phone: z.string().trim().min(10).max(15).optional(),
});

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError(409, 'An account with this email already exists.');

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: req.body.fullName,
        phone: req.body.phone || null,
        role: 'CITIZEN',
        profile: {
          create: { state: 'Andhra Pradesh' },
        },
      },
      include: { profile: true },
    });

    await recordAudit(req, 'USER_REGISTERED', 'User', user.id, { email: user.email });
    res.status(201).json({ token: signToken(user), user: sanitizeUser(user) });
  })
);

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email.toLowerCase() },
      include: { profile: true },
    });
    if (!user) throw new AppError(401, 'Invalid email or password.');
    if (!user.isActive) throw new AppError(403, 'This account has been deactivated. Contact support.');

    const valid = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!valid) throw new AppError(401, 'Invalid email or password.');

    req.user = user;
    await recordAudit(req, 'USER_LOGIN', 'User', user.id, { role: user.role });
    res.json({ token: signToken(user), user: sanitizeUser(user) });
  })
);

router.get('/me', authenticate, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  await recordAudit(req, 'USER_LOGOUT', 'User', req.user.id);
  res.json({ message: 'Signed out successfully.' });
}));

const forgotSchema = z.object({ email: z.string().trim().email() });

router.post(
  '/forgot-password',
  validate(forgotSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { email: req.body.email.toLowerCase() } });
    let resetToken = null;
    if (user) {
      resetToken = crypto.randomBytes(24).toString('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      await recordAudit(req, 'PASSWORD_RESET_REQUESTED', 'User', user.id);
    }
    res.json({
      message: 'If the account exists, a password reset link has been generated.',
      simulated: true,
      previewResetToken: resetToken,
    });
  })
);

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

router.post(
  '/reset-password',
  validate(resetSchema),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: req.body.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });
    if (!user) throw new AppError(400, 'This reset link is invalid or has expired.');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(req.body.password, 10),
        resetToken: null,
        resetTokenExpiry: null,
      },
    });
    res.json({ message: 'Password updated. You can now sign in.' });
  })
);

router.post(
  '/verify-phone/request',
  authenticate,
  asyncHandler(async (req, res) => {
    await prisma.user.update({ where: { id: req.user.id }, data: { phoneOtp: '123456' } });
    res.json({
      message: 'A verification code has been sent to your registered mobile number.',
      simulated: true,
      previewOtp: '123456',
    });
  })
);

router.post(
  '/verify-phone/confirm',
  authenticate,
  validate(z.object({ otp: z.string().length(6) })),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (req.body.otp !== (user.phoneOtp || '123456')) {
      throw new AppError(400, 'Incorrect verification code.');
    }
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true, phoneOtp: null },
      include: { profile: true },
    });
    await recordAudit(req, 'PHONE_VERIFIED', 'User', user.id);
    res.json({ message: 'Mobile number verified.', user: sanitizeUser(updated) });
  })
);

const profileSchema = z.object({
  fullName: z.string().trim().min(3).optional(),
  phone: z.string().trim().min(10).max(15).nullable().optional(),
  profile: z
    .object({
      aadhaarNumber: z.string().trim().max(20).nullable().optional(),
      addressLine: z.string().trim().max(200).nullable().optional(),
      city: z.string().trim().max(80).nullable().optional(),
      district: z.string().trim().max(80).nullable().optional(),
      state: z.string().trim().max(80).nullable().optional(),
      pincode: z.string().trim().max(10).nullable().optional(),
      dateOfBirth: z.coerce.date().nullable().optional(),
      gender: z.string().trim().max(20).nullable().optional(),
    })
    .optional(),
});

router.patch(
  '/profile',
  authenticate,
  validate(profileSchema),
  asyncHandler(async (req, res) => {
    const { fullName, phone, profile } = req.body;
    const data = {};
    if (fullName !== undefined) data.fullName = fullName;
    if (phone !== undefined) data.phone = phone || null;

    if (Object.keys(data).length) {
      await prisma.user.update({ where: { id: req.user.id }, data });
    }

    if (profile) {
      const profileData = Object.fromEntries(
        Object.entries(profile).filter(([, value]) => value !== undefined)
      );
      await prisma.citizenProfile.upsert({
        where: { userId: req.user.id },
        update: profileData,
        create: { userId: req.user.id, ...profileData },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { profile: true },
    });
    await recordAudit(req, 'PROFILE_UPDATED', 'User', user.id);
    res.json({ message: 'Profile updated.', user: sanitizeUser(user) });
  })
);

export default router;
