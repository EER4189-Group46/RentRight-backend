import { authService } from '../services/auth.service.js';
import { responseUtil } from '../utils/response.util.js';

/**
 * Controller: Handles incoming HTTP requests for authentication.
 */
class AuthController {
  /**
   * Register a new user
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return responseUtil.success(
        res,
        result,
        'Account registered successfully.',
        201
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Log in user
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return responseUtil.success(
        res,
        result,
        'Logged in successfully.',
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Request password reset token / link
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);
      return responseUtil.success(
        res,
        result,
        result.message,
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Reset password with reset token
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      const result = await authService.resetPassword(token, newPassword);
      return responseUtil.success(
        res,
        null,
        result.message,
        200
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Change password for logged-in user
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );
      return responseUtil.success(
        res,
        null,
        result.message,
        200
      );
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
