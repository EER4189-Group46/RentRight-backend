import { getPool } from '../database/db.js';

/**
 * Category Repository: MySQL Data Access Layer for Categories.
 */
class CategoryRepository {
  /**
   * Get all categories.
   * @returns {Promise<Array>}
   */
  async findAll() {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, slug, icon, description, created_at FROM categories ORDER BY name ASC'
    );
    return rows;
  }

  /**
   * Find a category by ID.
   * @param {number|string} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, slug, icon, description, created_at FROM categories WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find a category by slug.
   * @param {string} slug 
   * @returns {Promise<object|null>}
   */
  async findBySlug(slug) {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT id, name, slug, icon, description, created_at FROM categories WHERE slug = ? LIMIT 1',
      [slug]
    );
    return rows[0] || null;
  }
}

export const categoryRepository = new CategoryRepository();
