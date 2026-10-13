import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

/**
 * Utility functions for JSON Web Token (JWT) management.
 */
export const jwtUtil = {
  /**
   * Signs a JWT with the user's public identity payload.
   * @param {object} payload 
   * @param {string} [expiresIn] 
   * @returns {string}
   */
  generateToken(payload, expiresIn = config.jwtExpiresIn) {
    return jwt.sign(payload, config.jwtSecret, { expiresIn });
  },

  /**
   * Verifies and decodes a JWT token.
   * @param {string} token 
   * @returns {object}
   */
  verifyToken(token) {
    return jwt.verify(token, config.jwtSecret);
  },
};
