import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { asyncHandler, AppError } from '../utils/http.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { notifyUser } from '../utils/notify.js';
import { recordAudit } from '../utils/audit.js';
import { paymentReference } from '../utils/refs.js';

const router = Router();

const paymentInclude = {
  application: { select: { id: true, referenceNo: true, service: { select: { name: true } } } },
  user: { select: { id: true, fullName: true, email: true } },
};

async function loadPayment(req, id) {
  const payment = await prisma.payment.findUnique({ where: { id }, include: paymentInclude });
  if (!payment) throw new AppError(404, 'Payment not found.');
  if (req.user.role !== 'ADMIN' && payment.userId !== req.user.id) {
    throw new AppError(403, 'You do not have access to this payment.');
  }
  return payment;
}

router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: paymentInclude,
      orderBy: { createdAt: 'desc' },
    });
    res.json({ payments });
  })
);

const createSchema = z.object({
  applicationId: z.string().optional(),
  amount: z.coerce.number().positive().optional(),
  purpose: z.string().trim().max(200).optional(),
});

router.post(
  '/',
  authenticate,
  validate(createSchema),
  asyncHandler(async (req, res) => {
    let amount = req.body.amount;
    let purpose = req.body.purpose;
    let applicationId = null;

    if (req.body.applicationId) {
      const application = await prisma.application.findFirst({
        where: { id: req.body.applicationId, userId: req.user.id },
        include: { service: true },
      });
      if (!application) throw new AppError(404, 'Application not found.');
      if (Number(application.service.fee) <= 0) {
        throw new AppError(400, 'No payment is required for this application.');
      }

      const existing = await prisma.payment.findFirst({
        where: { applicationId: application.id, status: { in: ['PENDING', 'SUCCESS'] } },
        include: paymentInclude,
      });
      if (existing) {
        return res.json({ payment: existing, reused: true });
      }

      amount = Number(application.service.fee);
      purpose = purpose || `${application.service.name} fee`;
      applicationId = application.id;
    }

    if (!amount || amount <= 0) throw new AppError(400, 'Enter a valid payment amount.');

    const payment = await prisma.payment.create({
      data: {
        referenceNo: paymentReference(),
        userId: req.user.id,
        applicationId,
        amount,
        purpose: purpose || 'Amaravati One payment',
        status: 'PENDING',
      },
      include: paymentInclude,
    });

    await recordAudit(req, 'PAYMENT_INITIATED', 'Payment', payment.id, {
      referenceNo: payment.referenceNo,
      amount,
    });
    res.status(201).json({ payment });
  })
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const payment = await loadPayment(req, req.params.id);
    res.json({ payment });
  })
);

router.post(
  '/:id/confirm',
  authenticate,
  validate(z.object({ upiId: z.string().trim().min(3).max(80).optional() })),
  asyncHandler(async (req, res) => {
    const payment = await loadPayment(req, req.params.id);
    if (payment.status === 'SUCCESS') {
      return res.json({ payment, message: 'Payment already completed.' });
    }
    if (payment.status !== 'PENDING') {
      throw new AppError(400, 'This payment can no longer be completed.');
    }

    const transactionId = `UPI-${Date.now().toString().slice(-10)}`;
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        transactionId,
        upiId: req.body.upiId || 'citizen@upi',
        paidAt: new Date(),
      },
      include: paymentInclude,
    });

    if (payment.applicationId) {
      await prisma.dueDate.updateMany({
        where: { referenceId: payment.application?.referenceNo, isCompleted: false },
        data: { isCompleted: true },
      });
    }

    await notifyUser(payment.userId, {
      type: 'PAYMENT',
      title: 'Payment successful',
      message: `₹${Number(payment.amount).toLocaleString('en-IN')} paid successfully. Transaction ${transactionId}.`,
      link: '/app/payments',
    });
    await recordAudit(req, 'PAYMENT_SUCCESS', 'Payment', payment.id, {
      referenceNo: payment.referenceNo,
      amount: Number(payment.amount),
      transactionId,
    });

    res.json({
      message: 'Payment completed successfully (simulated UPI gateway).',
      simulated: true,
      payment: updated,
    });
  })
);

router.post(
  '/:id/fail',
  authenticate,
  asyncHandler(async (req, res) => {
    const payment = await loadPayment(req, req.params.id);
    if (payment.status !== 'PENDING') {
      throw new AppError(400, 'Only pending payments can be marked failed.');
    }
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
      include: paymentInclude,
    });
    await notifyUser(payment.userId, {
      type: 'PAYMENT',
      title: 'Payment failed',
      message: `Your payment of ₹${Number(payment.amount).toLocaleString('en-IN')} could not be completed. Please try again.`,
      link: '/app/payments',
    });
    await recordAudit(req, 'PAYMENT_FAILED', 'Payment', payment.id, {
      referenceNo: payment.referenceNo,
    });
    res.json({ message: 'Payment marked as failed (simulated).', simulated: true, payment: updated });
  })
);

router.get(
  '/:id/receipt',
  authenticate,
  asyncHandler(async (req, res) => {
    const payment = await loadPayment(req, req.params.id);
    const amount = Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Receipt ${payment.referenceNo}</title>
<style>
  body{font-family:Inter,Arial,sans-serif;background:#f7f9fc;color:#0b1f3a;padding:32px}
  .card{max-width:680px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px}
  .brand{color:#0b1f3a;font-size:22px;font-weight:800;letter-spacing:-.02em}
  .brand span{color:#0e9f9f}
  .muted{color:#64748b;font-size:13px}
  table{width:100%;border-collapse:collapse;margin-top:24px}
  td{padding:10px 0;border-bottom:1px solid #eef2f7;font-size:14px;vertical-align:top}
  td:first-child{color:#64748b;width:42%}
  .amount{font-size:30px;font-weight:800;color:#0b1f3a;margin:16px 0 4px}
  .badge{display:inline-block;padding:4px 10px;border-radius:999px;background:#ecfdf5;color:#047857;font-size:12px;font-weight:700}
  .pending{background:#fffbeb;color:#b45309}
  .footer{margin-top:28px;font-size:11px;color:#94a3b8;line-height:1.6}
  @media print{body{background:#fff;padding:0}.card{border:0}}
</style></head><body>
<div class="card">
  <div class="brand">Amaravati <span>One</span></div>
  <div class="muted">Unified Citizen Services &amp; Digital Wallet</div>
  <div class="amount">₹${amount}</div>
  <span class="badge ${payment.status === 'SUCCESS' ? '' : 'pending'}">${payment.status}</span>
  <table>
    <tr><td>Receipt / Reference</td><td>${payment.referenceNo}</td></tr>
    <tr><td>Purpose</td><td>${payment.purpose || 'Amaravati One payment'}</td></tr>
    <tr><td>Application</td><td>${payment.application?.referenceNo || '—'}</td></tr>
    <tr><td>Service</td><td>${payment.application?.service?.name || '—'}</td></tr>
    <tr><td>Method</td><td>${payment.method}${payment.upiId ? ` (${payment.upiId})` : ''}</td></tr>
    <tr><td>Transaction ID</td><td>${payment.transactionId || '—'}</td></tr>
    <tr><td>Paid on</td><td>${payment.paidAt ? new Date(payment.paidAt).toLocaleString('en-IN') : '—'}</td></tr>
    <tr><td>Citizen</td><td>${payment.user?.fullName || req.user.fullName}</td></tr>
  </table>
  <div class="footer">This receipt is generated by the Amaravati One prototype. The payment gateway is simulated and no real money was transferred. Generated on ${new Date().toLocaleString('en-IN')}.</div>
</div>
<script>if (new URLSearchParams(location.search).get('print') === '1') window.print();</script>
</body></html>`;
    res.type('html').send(html);
  })
);

export default router;
