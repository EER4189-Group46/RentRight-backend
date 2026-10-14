import { getPool } from '../database/db.js';

/**
 * Format raw database row to ensure numeric prices and dates are cleanly typed.
 */
function formatRequest(row) {
  if (!row) return null;
  return {
    ...row,
    price_per_day: parseFloat(row.price_per_day),
    payment_status: row.payment_id ? 'completed' : 'unpaid',
  };
}

/**
 * Rental Request Repository: MySQL Data Access Layer.
 */
class RentalRequestRepository {
  /**
   * Create a new rental request.
   * @param {object} data 
   * @returns {Promise<object>}
   */
  async create(data) {
    const pool = getPool();
    const { item_id, renter_id, start_date, end_date, status = 'pending' } = data;

    const [result] = await pool.execute(
      `INSERT INTO rental_requests (item_id, renter_id, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?)`,
      [item_id, renter_id, start_date, end_date, status]
    );

    return this.findById(result.insertId);
  }

  /**
   * Find a rental request by ID with joined item, provider, and payment details.
   * @param {number|string} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const pool = getPool();
    const query = `
      SELECT 
        r.id,
        r.item_id,
        r.renter_id,
        r.start_date,
        r.end_date,
        r.status,
        r.created_at,
        r.updated_at,
        i.name AS item_name,
        i.price_per_day,
        i.location AS item_location,
        i.provider_id,
        renter.name AS renter_name,
        renter.email AS renter_email,
        renter.phone AS renter_phone,
        provider.name AS provider_name,
        provider.email AS provider_email,
        provider.phone AS provider_phone,
        provider.business_name AS provider_business_name,
        p.id AS payment_id,
        p.amount AS payment_amount,
        p.transaction_id,
        p.created_at AS paid_at
      FROM rental_requests r
      INNER JOIN items i ON r.item_id = i.id
      INNER JOIN users renter ON r.renter_id = renter.id
      INNER JOIN users provider ON i.provider_id = provider.id
      LEFT JOIN payments p ON p.rental_request_id = r.id AND p.status = 'completed'
      WHERE r.id = ?
      LIMIT 1
    `;

    const [rows] = await pool.execute(query, [id]);
    return rows[0] ? formatRequest(rows[0]) : null;
  }

  /**
   * Find all rental requests created by a specific renter.
   * @param {number|string} renterId 
   * @returns {Promise<Array>}
   */
  async findByRenterId(renterId) {
    const pool = getPool();
    const query = `
      SELECT 
        r.id,
        r.item_id,
        r.renter_id,
        r.start_date,
        r.end_date,
        r.status,
        r.created_at,
        r.updated_at,
        i.name AS item_name,
        i.price_per_day,
        i.location AS item_location,
        i.provider_id,
        renter.name AS renter_name,
        provider.name AS provider_name,
        provider.business_name AS provider_business_name,
        p.id AS payment_id,
        p.amount AS payment_amount,
        p.transaction_id,
        p.created_at AS paid_at
      FROM rental_requests r
      INNER JOIN items i ON r.item_id = i.id
      INNER JOIN users renter ON r.renter_id = renter.id
      INNER JOIN users provider ON i.provider_id = provider.id
      LEFT JOIN payments p ON p.rental_request_id = r.id AND p.status = 'completed'
      WHERE r.renter_id = ?
      ORDER BY r.created_at DESC
    `;

    const [rows] = await pool.execute(query, [renterId]);
    return rows.map(formatRequest);
  }

  /**
   * Find all incoming rental requests for items owned by a provider.
   * @param {number|string} providerId 
   * @returns {Promise<Array>}
   */
  async findByProviderId(providerId) {
    const pool = getPool();
    const query = `
      SELECT 
        r.id,
        r.item_id,
        r.renter_id,
        r.start_date,
        r.end_date,
        r.status,
        r.created_at,
        r.updated_at,
        i.name AS item_name,
        i.price_per_day,
        i.location AS item_location,
        i.provider_id,
        renter.name AS renter_name,
        renter.email AS renter_email,
        renter.phone AS renter_phone,
        provider.name AS provider_name,
        p.id AS payment_id,
        p.amount AS payment_amount,
        p.transaction_id,
        p.created_at AS paid_at
      FROM rental_requests r
      INNER JOIN items i ON r.item_id = i.id
      INNER JOIN users renter ON r.renter_id = renter.id
      INNER JOIN users provider ON i.provider_id = provider.id
      LEFT JOIN payments p ON p.rental_request_id = r.id AND p.status = 'completed'
      WHERE i.provider_id = ?
      ORDER BY r.created_at DESC
    `;

    const [rows] = await pool.execute(query, [providerId]);
    return rows.map(formatRequest);
  }

  /**
   * Update the status of a rental request.
   * @param {number|string} id 
   * @param {string} status ('accepted' | 'rejected' | 'completed' | 'cancelled')
   * @returns {Promise<object>}
   */
  async updateStatus(id, status) {
    const pool = getPool();
    await pool.execute(
      `UPDATE rental_requests
       SET status = ?
       WHERE id = ?`,
      [status, id]
    );
    return this.findById(id);
  }
  /**
   * Cancel a request only if it belongs to the renter,
   * is pending or accepted, and has no completed payment.
   */
  async cancelRequest(id, renterId) {
    const pool = getPool();

    const [result] = await pool.execute(
      `UPDATE rental_requests AS r
       SET r.status = 'cancelled'
       WHERE r.id = ?
         AND r.renter_id = ?
         AND r.status IN ('pending', 'accepted')
         AND NOT EXISTS (
           SELECT 1
           FROM payments p
           WHERE p.rental_request_id = r.id
             AND p.status = 'completed'
         )`,
      [id, renterId]
    );

    // No matching eligible request was updated.
    if (result.affectedRows === 0) {
      return null;
    }

    return this.findById(id);
  }
}

export const rentalRequestRepository = new RentalRequestRepository();
