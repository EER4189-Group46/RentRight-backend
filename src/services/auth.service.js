import crypto from 'node:crypto';
import { userRepository } from '../repositories/user.repository.js';
import { tokenRepository } from '../repositories/token.repository.js';
import { passwordUtil } from '../utils/password.util.js';
import { jwtUtil } from '../utils/jwt.util.js';
import { emailService } from './email.service.js';
import { config } from '../config/env.js';
import {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError
} from '../utils/errors.js';

/**
 * Sanitizes a user database record by removing sensitive fields like password_hash.
 * @param {object} user 
 * @returns {object}
 */
export function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

/**
 * Hash raw token with sha256 for secure database storage.
 * @param {string} rawToken 
 * @returns {string}
 */
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Authentication Business Logic Service.
 */
class AuthService {
  /**
   * Register a new user account.
   * @param {object} data
   * @returns {Promise<{ user: object, token: string }>}
   */
  async register(data) {
    const {
      name,
      email,
      password,
      phone,
      role = 'renter',
      provider_type = 'individual',
      business_name = null,
    } = data;

    // Check if email already registered
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('An account with this email already exists.');
    }

    // Hash user password
    const passwordHash = await passwordUtil.hash(password);

    // Save to database
    const newUser = await userRepository.create({
      name,
      email,
      passwordHash,
      phone,
      role,
      provider_type,
      business_name,
    });

    const safeUser = sanitizeUser(newUser);

    // Generate JWT token
    const token = jwtUtil.generateToken({
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
    });

    return {
      user: safeUser,
      token,
    };
  }

  /**
   * Log in user with credentials.
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<{ user: object, token: string }>}
   */
  async login(email, password) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const isMatch = await passwordUtil.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    const safeUser = sanitizeUser(user);

    // Generate JWT token
    const token = jwtUtil.generateToken({
      id: safeUser.id,
      email: safeUser.email,
      role: safeUser.role,
    });

    return {
      user: safeUser,
      token,
    };
  }

  /**
   * Initiate password reset by generating and emailing a reset token.
   * @param {string} email 
   * @returns {Promise<{ message: string, devToken?: string }>}
   */
  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);

    // Even if user not found, respond with neutral success to avoid email harvesting
    if (!user) {
      return {
        message: 'If an account with that email exists, password reset instructions have been sent.',
      };
    }

    // Generate 32-byte cryptographically secure token
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawResetToken);

    // Invalidate existing active tokens
    await tokenRepository.invalidateAllForUser(user.id);

    // Calculate expiry (default: 60 minutes)
    const expiresAt = new Date(Date.now() + config.resetTokenExpiresMinutes * 60 * 1000);

    // Store hashed token
    await tokenRepository.createPasswordResetToken(user.id, tokenHash, config.resetTokenExpiresMinutes);

    // Send email notification
    await emailService.sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetToken: rawResetToken,
      expiresInMinutes: config.resetTokenExpiresMinutes,
    });

    const response = {
      message: 'If an account with that email exists, password reset instructions have been sent.',
    };

    // Include token in response in development mode for easy API testing
    if (config.nodeEnv === 'development') {
      response.devToken = rawResetToken;
    }

    return response;
  }

  /**
   * Reset password using a valid reset token.
   * @param {string} rawToken 
   * @param {string} newPassword 
   * @returns {Promise<{ message: string }>}
   */
  async resetPassword(rawToken, newPassword) {
    if (!rawToken) {
      throw new BadRequestError('Reset token is required.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters long.');
    }

    const tokenHash = hashToken(rawToken);
    const tokenRecord = await tokenRepository.findValidToken(tokenHash);

    if (!tokenRecord) {
      throw new BadRequestError('Reset token is invalid or has expired.');
    }

    const user = await userRepository.findById(tokenRecord.user_id);
    if (!user) {
      throw new NotFoundError('User account not found.');
    }

    // Hash new password and update
    const newPasswordHash = await passwordUtil.hash(newPassword);
    await userRepository.updatePassword(user.id, newPasswordHash);

    // Invalidate token
    await tokenRepository.markAsUsed(tokenRecord.id);

    return {
      message: 'Password has been reset successfully. You can now log in with your new password.',
    };
  }

  /**
   * Change password for an authenticated user.
   * @param {number|string} userId 
   * @param {string} currentPassword 
   * @param {string} newPassword 
   * @returns {Promise<{ message: string }>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User account not found.');
    }

    const isMatch = await passwordUtil.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestError('New password must be at least 6 characters long.');
    }

    const newPasswordHash = await passwordUtil.hash(newPassword);
    await userRepository.updatePassword(userId, newPasswordHash);

    return {
      message: 'Password changed successfully.',
    };
  }
}

export const authService = new AuthService();
