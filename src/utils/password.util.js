import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Utility functions for password encryption and verification.
 */
export const passwordUtil = {
  /**
   * Hashes a plaintext password using bcrypt.
   * @param {string} plainPassword 
   * @returns {Promise<string>}
   */
  async hash(plainPassword) {
    return bcrypt.hash(plainPassword, SALT_ROUNDS);
  },

  /**
   * Verifies if a plaintext password matches a stored hash.
   * @param {string} plainPassword 
   * @param {string} hashedPassword 
   * @returns {Promise<boolean>}
   */
  async compare(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
};
