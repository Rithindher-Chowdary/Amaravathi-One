import prisma from '../lib/prisma.js';

export async function recordAudit(req, action, entity, entityId, metadata) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: req.user?.id || null,
        action,
        entity,
        entityId: entityId || null,
        metadata: metadata || undefined,
        ipAddress: req.ip || null,
      },
    });
  } catch (error) {
    console.error('Audit log failed:', error.message);
  }
}
