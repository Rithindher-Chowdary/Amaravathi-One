export const sanitizeUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    phoneVerified: user.phoneVerified,
    createdAt: user.createdAt,
    profile: user.profile || null,
  };
};
