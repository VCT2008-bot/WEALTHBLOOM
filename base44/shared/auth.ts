// Shared role helpers for WEALTHBLOOM backend functions.
// "admin" and "super_admin" are both admin-tier; only "super_admin" can manage roles.

export function isAdminLike(role) {
  return role === 'admin' || role === 'super_admin';
}

export function isSuperAdmin(role) {
  return role === 'super_admin';
}

export function roleLabel(role) {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  return 'Member';
}