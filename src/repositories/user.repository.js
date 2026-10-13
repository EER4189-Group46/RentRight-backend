import { getPool } from '../database/db.js';

/**
 * User Repository: MySQL Data Access Layer for User entities.
 */
class UserRepository {
  /**
   * Find a user by email address.
   * @param {string} email 
   * @returns {Promise<object|null>}
   */
  async findByEmail(email) {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );
    return rows[0] || null;
  }

  /**
   * Find a user by ID.
   * @param {number|string} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Create a new user record.
   * @param {object} userData 
   * @returns {Promise<object>}
   */
  async create(userData) {
    const pool = getPool();
    const {
      name,
      email,
      passwordHash,
      phone = null,
      role = 'renter',
      provider_type = 'individual',
      business_name = null,
    } = userData;

    const [result] = await pool.execute(
      `INSERT INTO users (name, email, password_hash, phone, role, provider_type, business_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        email.trim().toLowerCase(),
        passwordHash,
        phone ? phone.trim() : null,
        role,
        role === 'provider' ? (provider_type || 'individual') : 'individual',
        role === 'provider' && provider_type === 'business' ? business_name : null,
      ]
    );

    return this.findById(result.insertId);
  }

  /**
   * Update an existing user's profile.
   * @param {number|string} id 
   * @param {object} updateData 
   * @returns {Promise<object|null>}
   */
  async update(id, updateData) {
    const pool = getPool();
    const user = await this.findById(id);
    if (!user) return null;

    const name = updateData.name !== undefined ? updateData.name.trim() : user.name;
    const phone = updateData.phone !== undefined ? updateData.phone : user.phone;
    const provider_type = updateData.provider_type !== undefined ? updateData.provider_type : user.provider_type;
    const business_name = updateData.business_name !== undefined ? updateData.business_name : user.business_name;

    await pool.execute(
      `UPDATE users
       SET name = ?, phone = ?, provider_type = ?, business_name = ?
       WHERE id = ?`,
      [name, phone, provider_type, business_name, id]
    );

    return this.findById(id);
  }

  /**
   * Update user's password hash.
   * @param {number|string} id 
   * @param {string} passwordHash 
   * @returns {Promise<boolean>}
   */
  async updatePassword(id, passwordHash) {
    const pool = getPool();
    const [result] = await pool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, id]
    );
    return result.affectedRows > 0;
  }
}

export const userRepository = new UserRepository();
