import { getPool } from '../database/db.js';

/**
 * Token Repository: MySQL Data Access Layer for password reset tokens.
 * Uses UTC_TIMESTAMP() to guarantee timezone consistency across servers.
 */
class TokenRepository {
  /**
   * Save a new password reset token with expiration in minutes.
   * @param {number|string} userId 
   * @param {string} tokenHash 
   * @param {number} expiresInMinutes 
   * @returns {Promise<object>}
   */
  async createPasswordResetToken(userId, tokenHash, expiresInMinutes = 60) {
    const pool = getPool();
    const minutes = parseInt(expiresInMinutes, 10) || 60;

    const [result] = await pool.execute(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? MINUTE), UTC_TIMESTAMP())`,
      [userId, tokenHash, minutes]
    );

    return this.findById(result.insertId);
  }

  /**
   * Find a reset token record by ID.
   * @param {number|string} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM password_reset_tokens WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find a valid, non-expired, unused token by its hash.
   * @param {string} tokenHash 
   * @returns {Promise<object|null>}
   */
  async findValidToken(tokenHash) {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = ?
         AND used_at IS NULL
         AND expires_at > UTC_TIMESTAMP()
       LIMIT 1`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  /**
   * Mark a reset token as used.
   * @param {number|string} id 
   * @returns {Promise<boolean>}
   */
  async markAsUsed(id) {
    const pool = getPool();
    const [result] = await pool.execute(
      'UPDATE password_reset_tokens SET used_at = UTC_TIMESTAMP() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Invalidate all existing tokens for a given user.
   * @param {number|string} userId 
   * @returns {Promise<void>}
   */
  async invalidateAllForUser(userId) {
    const pool = getPool();
    await pool.execute(
      'UPDATE password_reset_tokens SET used_at = UTC_TIMESTAMP() WHERE user_id = ? AND used_at IS NULL',
      [userId]
    );
  }
}

export const tokenRepository = new TokenRepository();
