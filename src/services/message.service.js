import { messageRepository } from '../repositories/message.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/errors.js';

/**
 * Message Service: Business logic for the renter-provider chat feature.
 */
class MessageService {
  /**
   * Send a message from one user to another.
   * Validates receiver exists and that a user is not messaging themselves.
   *
   * @param {number} senderId - Authenticated user ID.
   * @param {object} body - { receiver_id, item_id?, content }
   * @returns {Promise<object>} Created message.
   */
  async sendMessage(senderId, body) {
    const { receiver_id, item_id = null, content } = body;

    if (!receiver_id || !content?.trim()) {
      throw new AppError('receiver_id and content are required.', 400);
    }

    if (Number(senderId) === Number(receiver_id)) {
      throw new AppError('You cannot send a message to yourself.', 400);
    }

    // Verify receiver exists
    const receiver = await userRepository.findById(receiver_id);
    if (!receiver) {
      throw new AppError('Recipient user not found.', 404);
    }

    const message = await messageRepository.create({
      sender_id: senderId,
      receiver_id,
      item_id: item_id || null,
      content: content.trim(),
    });

    return message;
  }

  /**
   * Retrieve the full conversation thread between the authenticated user and another user.
   *
   * @param {number} currentUserId
   * @param {number} otherUserId
   * @returns {Promise<{ messages: Array, other_user: object }>}
   */
  async getConversation(currentUserId, otherUserId) {
    if (!otherUserId) {
      throw new AppError('Target user ID is required.', 400);
    }

    const otherUser = await userRepository.findById(otherUserId);
    if (!otherUser) {
      throw new AppError('User not found.', 404);
    }

    const messages = await messageRepository.findConversation(currentUserId, otherUserId);

    return {
      messages,
      other_user: {
        id: otherUser.id,
        name: otherUser.name,
        email: otherUser.email,
        role: otherUser.role,
      },
    };
  }

  /**
   * List all conversation threads (latest message per thread) for a user.
   *
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  async listConversations(userId) {
    return messageRepository.findConversationsForUser(userId);
  }
}

export const messageService = new MessageService();
