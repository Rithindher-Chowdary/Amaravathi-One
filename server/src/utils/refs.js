import prisma from '../lib/prisma.js';

export async function nextApplicationReference() {
  const year = new Date().getFullYear();
  const prefix = `AMA-${year}-`;
  const count = await prisma.application.count({
    where: { referenceNo: { startsWith: prefix } },
  });
  return `${prefix}${String(count + 1).padStart(3, '0')}`;
}

export function paymentReference() {
  const stamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 900 + 100);
  return `PAY-${stamp}-${random}`;
}
