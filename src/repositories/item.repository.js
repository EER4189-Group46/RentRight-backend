import { getPool } from '../database/db.js';

/**
 * Helper to ensure images field is returned as a parsed JavaScript array.
 */
function formatItem(row) {
  if (!row) return null;
  let parsedImages = [];
  if (row.images) {
    if (Array.isArray(row.images)) {
      parsedImages = row.images;
    } else if (typeof row.images === 'string') {
      try {
        parsedImages = JSON.parse(row.images);
      } catch {
        parsedImages = [row.images];
      }
    }
  }
  return {
    ...row,
    price_per_day: parseFloat(row.price_per_day),
    price_per_hour: row.price_per_hour !== null ? parseFloat(row.price_per_hour) : null,
    deposit_amount: row.deposit_amount !== null ? parseFloat(row.deposit_amount) : null,
    total_requests: row.total_requests !== undefined ? parseInt(row.total_requests || 0, 10) : undefined,
    pending_requests: row.pending_requests !== undefined ? parseInt(row.pending_requests || 0, 10) : undefined,
    accepted_requests: row.accepted_requests !== undefined ? parseInt(row.accepted_requests || 0, 10) : undefined,
    images: parsedImages,
  };
}

/**
 * Item Repository: MySQL Data Access Layer for Rental Items.
 */
class ItemRepository {
  /**
   * Search and filter rental items dynamically.
   * @param {object} filters
   * @param {string} [filters.keyword]
   * @param {number|string} [filters.category_id]
   * @param {number|string} [filters.min_price]
   * @param {number|string} [filters.max_price]
   * @param {string} [filters.location]
   * @param {string} [filters.status]
   * @param {string} [filters.sort]
   * @returns {Promise<Array>}
   */
  async findFiltered(filters = {}) {
    const pool = getPool();
    const {
      keyword,
      category_id,
      min_price,
      max_price,
      location,
      status,
      sort = 'newest',
    } = filters;

    let query = `
      SELECT 
        i.id,
        i.provider_id,
        i.category_id,
        i.name,
        i.description,
        i.price_per_day,
        i.price_per_hour,
        i.deposit_amount,
        i.location,
        i.status,
        i.images,
        i.created_at,
        i.updated_at,
        c.name AS category_name,
        c.slug AS category_slug,
        u.name AS provider_name,
        u.role AS provider_role,
        u.provider_type,
        u.business_name
      FROM items i
      INNER JOIN categories c ON i.category_id = c.id
      INNER JOIN users u ON i.provider_id = u.id
      WHERE 1=1
    `;

    const params = [];

    // Filter by status (default to available unless explicitly overridden)
    if (status) {
      query += ` AND i.status = ?`;
      params.push(status);
    } else {
      query += ` AND i.status = 'available'`;
    }

    // Keyword search (matches item title, description, or category name)
    if (keyword && keyword.trim()) {
      const term = `%${keyword.trim()}%`;
      query += ` AND (i.name LIKE ? OR i.description LIKE ? OR c.name LIKE ?)`;
      params.push(term, term, term);
    }

    // Category filter
    if (category_id) {
      query += ` AND i.category_id = ?`;
      params.push(parseInt(category_id, 10));
    }

    // Min price
    if (min_price !== undefined && min_price !== '' && !isNaN(Number(min_price))) {
      query += ` AND i.price_per_day >= ?`;
      params.push(parseFloat(min_price));
    }

    // Max price
    if (max_price !== undefined && max_price !== '' && !isNaN(Number(max_price))) {
      query += ` AND i.price_per_day <= ?`;
      params.push(parseFloat(max_price));
    }

    // Location search
    if (location && location.trim()) {
      query += ` AND i.location LIKE ?`;
      params.push(`%${location.trim()}%`);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query += ` ORDER BY i.price_per_day ASC, i.id DESC`;
        break;
      case 'price_desc':
        query += ` ORDER BY i.price_per_day DESC, i.id DESC`;
        break;
      case 'newest':
      default:
        query += ` ORDER BY i.created_at DESC, i.id DESC`;
        break;
    }

    const [rows] = await pool.execute(query, params);
    return rows.map(formatItem);
  }

  /**
   * Find an item by its ID with full provider and category metadata.
   * @param {number|string} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const pool = getPool();
    const query = `
      SELECT 
        i.id,
        i.provider_id,
        i.category_id,
        i.name,
        i.description,
        i.price_per_day,
        i.price_per_hour,
        i.deposit_amount,
        i.location,
        i.status,
        i.images,
        i.created_at,
        i.updated_at,
        c.name AS category_name,
        c.slug AS category_slug,
        u.name AS provider_name,
        u.email AS provider_email,
        u.phone AS provider_phone,
        u.role AS provider_role,
        u.provider_type,
        u.business_name
      FROM items i
      INNER JOIN categories c ON i.category_id = c.id
      INNER JOIN users u ON i.provider_id = u.id
      WHERE i.id = ?
      LIMIT 1
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? formatItem(rows[0]) : null;
  }

  /**
   * Find all items listed by a specific provider.
   * @param {number|string} providerId 
   * @returns {Promise<Array>}
   */
  async findByProviderId(providerId) {
    const pool = getPool();
    const query = `
      SELECT 
        i.id,
        i.provider_id,
        i.category_id,
        i.name,
        i.description,
        i.price_per_day,
        i.price_per_hour,
        i.deposit_amount,
        i.location,
        i.status,
        i.images,
        i.created_at,
        i.updated_at,
        c.name AS category_name,
        c.slug AS category_slug,
        (SELECT COUNT(*) FROM rental_requests r WHERE r.item_id = i.id) AS total_requests,
        (SELECT COUNT(*) FROM rental_requests r WHERE r.item_id = i.id AND r.status = 'pending') AS pending_requests,
        (SELECT COUNT(*) FROM rental_requests r WHERE r.item_id = i.id AND r.status = 'accepted') AS accepted_requests
      FROM items i
      INNER JOIN categories c ON i.category_id = c.id
      WHERE i.provider_id = ?
      ORDER BY i.created_at DESC
    `;

    const [rows] = await pool.execute(query, [providerId]);
    return rows.map(formatItem);
  }

  /**
   * Create a new rental item.
   * @param {object} itemData 
   * @returns {Promise<object>}
   */
  async create(itemData) {
    const pool = getPool();
    const {
      provider_id,
      category_id,
      name,
      description = null,
      price_per_day,
      price_per_hour = null,
      deposit_amount = null,
      location,
      status = 'available',
      images = [],
    } = itemData;

    const parsedDeposit =
      deposit_amount !== undefined && deposit_amount !== '' && deposit_amount !== null && !isNaN(Number(deposit_amount))
        ? parseFloat(deposit_amount)
        : null;

    const parsedPricePerHour =
      price_per_hour !== undefined && price_per_hour !== '' && price_per_hour !== null && !isNaN(Number(price_per_hour))
        ? parseFloat(price_per_hour)
        : null;

    const [result] = await pool.execute(
      `INSERT INTO items 
        (provider_id, category_id, name, description, price_per_day, price_per_hour, deposit_amount, location, status, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        provider_id,
        category_id,
        name.trim(),
        description ? description.trim() : null,
        parseFloat(price_per_day),
        parsedPricePerHour,
        parsedDeposit,
        location.trim(),
        status,
        JSON.stringify(images),
      ]
    );

    return this.findById(result.insertId);
  }

  /**
   * Update an existing item.
   * @param {number|string} id 
   * @param {object} updateData 
   * @returns {Promise<object|null>}
   */
  async update(id, updateData) {
    const pool = getPool();
    const current = await this.findById(id);
    if (!current) return null;

    const name = updateData.name !== undefined ? updateData.name.trim() : current.name;
    const category_id = updateData.category_id !== undefined ? updateData.category_id : current.category_id;
    const description = updateData.description !== undefined ? updateData.description : current.description;
    const price_per_day = updateData.price_per_day !== undefined && !isNaN(Number(updateData.price_per_day))
      ? parseFloat(updateData.price_per_day)
      : current.price_per_day;

    const price_per_hour = updateData.price_per_hour !== undefined
      ? (updateData.price_per_hour !== '' && updateData.price_per_hour !== null && !isNaN(Number(updateData.price_per_hour))
          ? parseFloat(updateData.price_per_hour)
          : null)
      : current.price_per_hour;

    const deposit_amount = updateData.deposit_amount !== undefined
      ? (updateData.deposit_amount !== '' && updateData.deposit_amount !== null && !isNaN(Number(updateData.deposit_amount))
          ? parseFloat(updateData.deposit_amount)
          : null)
      : current.deposit_amount;

    const location = updateData.location !== undefined ? updateData.location.trim() : current.location;
    const status = updateData.status !== undefined ? updateData.status : current.status;
    const images = updateData.images !== undefined ? JSON.stringify(updateData.images) : JSON.stringify(current.images);

    await pool.execute(
      `UPDATE items
       SET name = ?, category_id = ?, description = ?, price_per_day = ?, price_per_hour = ?,
           deposit_amount = ?, location = ?, status = ?, images = ?
       WHERE id = ?`,
      [
        name,
        category_id,
        description,
        price_per_day,
        price_per_hour,
        deposit_amount,
        location,
        status,
        images,
        id,
      ]
    );

    return this.findById(id);
  }

  /**
   * Delete an item by ID.
   * @param {number|string} id 
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    const pool = getPool();
    const [result] = await pool.execute('DELETE FROM items WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

export const itemRepository = new ItemRepository();
