import { jwtUtil } from '../utils/jwt.util.js';
import { userRepository } from '../repositories/user.repository.js';
import { sanitizeUser } from '../services/auth.service.js';
import { responseUtil } from '../utils/response.util.js';

/**
 * Middleware: Verifies the JWT Bearer token in the Authorization header.
 * Attaches the authenticated user to req.user.
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return responseUtil.error(res, 'Authentication token required. Please sign in.', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwtUtil.verifyToken(token);
    const user = await userRepository.findById(decoded.id);

    if (!user) {
      return responseUtil.error(res, 'User session expired or user no longer exists.', 401);
    }

    req.user = sanitizeUser(user);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return responseUtil.error(res, 'Token expired. Please sign in again.', 401);
    }
    return responseUtil.error(res, 'Invalid authentication token.', 401);
  }
}

/**
 * Middleware: Restricts route access to specific roles (e.g. 'provider', 'admin').
 * @param  {...string} allowedRoles
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return responseUtil.error(
        res,
        `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`,
        403
      );
    }
    next();
  };
}
