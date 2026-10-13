import { responseUtil } from '../utils/response.util.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validation middlewares for authentication routes.
 */
export const validateAuth = {
  /**
   * Validate user registration payload.
   */
  register(req, res, next) {
    const { name, email, password, role, provider_type, business_name } = req.body;
    const errors = {};

    if (!name || !name.trim()) {
      errors.name = 'Full name is required.';
    }

    if (!email || !email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (role && !['renter', 'provider', 'admin'].includes(role)) {
      errors.role = 'Role must be either "renter" or "provider".';
    }

    if (role === 'provider' && provider_type === 'business' && (!business_name || !business_name.trim())) {
      errors.business_name = 'Business name is required for business providers.';
    }

    if (Object.keys(errors).length > 0) {
      return responseUtil.error(res, 'Validation failed. Please check the submitted fields.', 400, errors);
    }

    next();
  },

  /**
   * Validate login payload.
   */
  login(req, res, next) {
    const { email, password } = req.body;
    const errors = {};

    if (!email || !email.trim()) {
      errors.email = 'Email address is required.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    if (Object.keys(errors).length > 0) {
      return responseUtil.error(res, 'Please provide both email and password.', 400, errors);
    }

    next();
  },

  /**
   * Validate forgot-password payload.
   */
  forgotPassword(req, res, next) {
    const { email } = req.body;

    if (!email || !email.trim() || !EMAIL_REGEX.test(email.trim())) {
      return responseUtil.error(res, 'A valid email address is required.', 400, {
        email: 'Please provide a valid email address.',
      });
    }

    next();
  },

  /**
   * Validate reset-password payload.
   */
  resetPassword(req, res, next) {
    const { token, newPassword } = req.body;
    const errors = {};

    if (!token || !token.trim()) {
      errors.token = 'Reset token is required.';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters long.';
    }

    if (Object.keys(errors).length > 0) {
      return responseUtil.error(res, 'Validation failed.', 400, errors);
    }

    next();
  },

  /**
   * Validate change-password payload.
   */
  changePassword(req, res, next) {
    const { currentPassword, newPassword } = req.body;
    const errors = {};

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required.';
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required.';
    } else if (newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters long.';
    }

    if (Object.keys(errors).length > 0) {
      return responseUtil.error(res, 'Validation failed.', 400, errors);
    }

    next();
  },
};
