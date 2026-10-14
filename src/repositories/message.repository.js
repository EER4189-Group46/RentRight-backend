import { getPool } from '../database/db.js';

/**
 * Message Repository: MySQL Data Access Layer for renter-provider chat messages.
 */
class MessageRepository {
  /**
   * Insert a new message into the database.
   * @param {object} data - { sender_id, receiver_id, item_id, content }
   * @returns {Promise<object>} The created message with sender info.
   */
  async create(data) {
    const pool = getPool();
    const { sender_id, receiver_id, item_id = null, content } = data;

    const [result] = await pool.execute(
      `INSERT INTO messages (sender_id, receiver_id, item_id, content)
       VALUES (?, ?, ?, ?)`,
      [sender_id, receiver_id, item_id, content]
    );

    return this.findById(result.insertId);
  }

  /**
   * Find a single message by ID, joined with sender name.
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT m.*, u.name AS sender_name
       FROM messages m
       INNER JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Fetch all messages exchanged between two users (optionally scoped to an item).
   * Returns messages in ascending chronological order.
   * @param {number} userA
   * @param {number} userB
   * @returns {Promise<Array>}
   */
  async findConversation(userA, userB) {
    const pool = getPool();
    const [rows] = await pool.execute(
      `SELECT m.id,
              m.sender_id,
              m.receiver_id,
              m.item_id,
              m.content,
              m.created_at,
              sender.name  AS sender_name,
              receiver.name AS receiver_name
       FROM messages m
       INNER JOIN users sender   ON m.sender_id   = sender.id
       INNER JOIN users receiver ON m.receiver_id = receiver.id
       WHERE (m.sender_id = ? AND m.receiver_id = ?)
          OR (m.sender_id = ? AND m.receiver_id = ?)
       ORDER BY m.created_at ASC`,
      [userA, userB, userB, userA]
    );
    return rows;
  }

  /**
   * Fetch the latest unique conversation threads for a user.
   * Each thread is identified by the other participant and (optionally) an item.
   * Returns one row per conversation with the most recent message preview.
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  async findConversationsForUser(userId) {
    const pool = getPool();

    // For each unique (other_user_id) pair, return the latest message preview
    const [rows] = await pool.execute(
      `SELECT
         conv.other_user_id,
         other.name        AS other_user_name,
         other.email       AS other_user_email,
         other.role        AS other_user_role,
         conv.item_id,
         i.name            AS item_name,
         conv.last_message_time,
         conv.last_message_content
       FROM (
         SELECT
           CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AS other_user_id,
           m.item_id,
           MAX(m.created_at)                                                   AS last_message_time,
           SUBSTRING_INDEX(GROUP_CONCAT(m.content ORDER BY m.created_at DESC SEPARATOR '||'), '||', 1) AS last_message_content
         FROM messages m
         WHERE m.sender_id = ? OR m.receiver_id = ?
         GROUP BY other_user_id, m.item_id
       ) conv
       INNER JOIN users other ON conv.other_user_id = other.id
       LEFT  JOIN items i     ON conv.item_id = i.id
       ORDER BY conv.last_message_time DESC`,
      [userId, userId, userId]
    );
    return rows;
  }
}

export const messageRepository = new MessageRepository();
