import { getPool } from '../database/db.js';

/**
 * Format raw payment row.
 */
function formatPayment(row) {
  if (!row) return null;
  return {
    ...row,
    amount: parseFloat(row.amount),
  };
}

/**
 * Payment Repository: MySQL Data Access Layer for Rental Payments.
 */
class PaymentRepository {
  /**
   * Create a new payment record.
   * @param {object} paymentData 
   * @returns {Promise<object>}
   */
  async create(paymentData) {
    const pool = getPool();
    const {
      rental_request_id,
      user_id,
      amount,
      payment_method = 'card',
      transaction_id,
      status = 'completed',
    } = paymentData;

    const [result] = await pool.execute(
      `INSERT INTO payments 
        (rental_request_id, user_id, amount, payment_method, transaction_id, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        rental_request_id,
        user_id,
        amount,
        payment_method,
        transaction_id,
        status,
      ]
    );

    return this.findById(result.insertId);
  }

  /**
   * Find payment by ID.
   * @param {number|string} id 
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM payments WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] ? formatPayment(rows[0]) : null;
  }

  /**
   * Find payment by rental_request_id.
   * @param {number|string} rentalRequestId 
   * @returns {Promise<object|null>}
   */
  async findByRentalRequestId(rentalRequestId) {
    const pool = getPool();
    const [rows] = await pool.execute(
      'SELECT * FROM payments WHERE rental_request_id = ? AND status = "completed" LIMIT 1',
      [rentalRequestId]
    );
    return rows[0] ? formatPayment(rows[0]) : null;
  }

  /**
   * Fetch payment history for a specific user/renter.
   * Formatted to match PaymentHistoryPage.jsx fields.
   * @param {number|string} userId 
   * @returns {Promise<Array>}
   */
  async findByUserId(userId) {
    const pool = getPool();
    const query = `
      SELECT 
        p.id AS payment_id,
        p.amount,
        p.payment_method,
        p.transaction_id,
        p.created_at AS paid_at,
        r.id AS rental_request_id,
        r.start_date,
        r.end_date,
        i.id AS item_id,
        i.name AS item_name,
        provider.name AS provider_name
      FROM payments p
      INNER JOIN rental_requests r ON p.rental_request_id = r.id
      INNER JOIN items i ON r.item_id = i.id
      INNER JOIN users provider ON i.provider_id = provider.id
      WHERE p.user_id = ? AND p.status = 'completed'
      ORDER BY p.created_at DESC
    `;

    const [rows] = await pool.execute(query, [userId]);
    return rows.map(formatPayment);
  }

  /**
   * Fetch earnings report payments for an item provider.
   * Formatted to match EarningsPage.jsx fields.
   * @param {number|string} providerId 
   * @returns {Promise<Array>}
   */
  async findEarningsByProviderId(providerId) {
    const pool = getPool();
    const query = `
      SELECT 
        p.id AS payment_id,
        p.amount,
        p.payment_method,
        p.transaction_id,
        p.created_at AS paid_at,
        r.id AS rental_request_id,
        r.start_date,
        r.end_date,
        i.id AS item_id,
        i.name AS item_name,
        renter.name AS renter_name
      FROM payments p
      INNER JOIN rental_requests r ON p.rental_request_id = r.id
      INNER JOIN items i ON r.item_id = i.id
      INNER JOIN users renter ON r.renter_id = renter.id
      WHERE i.provider_id = ? AND p.status = 'completed'
      ORDER BY p.created_at DESC
    `;

    const [rows] = await pool.execute(query, [providerId]);
    return rows.map(formatPayment);
  }
}

export const paymentRepository = new PaymentRepository();
