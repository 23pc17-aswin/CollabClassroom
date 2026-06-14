/**
 * RBAC (Role-Based Access Control) middleware factory.
 * Reads Keycloak roles from req.user.realm_access.roles.
 * @module middleware/rbac
 */

/**
 * Returns an Express middleware that allows only users with one of the specified roles.
 * Must be used AFTER verifyToken middleware.
 *
 * @param {string[]} allowedRoles - Array of allowed role strings, e.g. ['ADMIN', 'TEACHER']
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.post('/admin/users', verifyToken, checkRole(['ADMIN']), provisionUser);
 */
export function checkRole(allowedRoles) {
  return (req, res, next) => {
    const roles = req.user?.realm_access?.roles ?? [];

    const hasRole = allowedRoles.some((r) => roles.includes(r));

    if (!hasRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}
