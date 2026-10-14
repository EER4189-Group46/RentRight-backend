import { messageService } from '../services/message.service.js';
import { responseUtil } from '../utils/response.util.js';

/**
 * Message Controller: HTTP handlers for the renter-provider chat API.
 */
class MessageController {
  /**
   * POST /api/messages
   * Send a new message to another user (optionally scoped to an item listing).
   */
  async send(req, res, next) {
    try {
      const message = await messageService.sendMessage(req.user.id, req.body);
      return responseUtil.success(res, message, 'Message sent successfully.', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/messages/conversations
   * List all conversation threads for the authenticated user.
   */
  async listConversations(req, res, next) {
    try {
      const conversations = await messageService.listConversations(req.user.id);
      return responseUtil.success(res, conversations, 'Conversations retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/messages/:otherUserId
   * Retrieve the full message thread with a specific user.
   */
  async getConversation(req, res, next) {
    try {
      const result = await messageService.getConversation(
        req.user.id,
        Number(req.params.otherUserId)
      );
      return responseUtil.success(res, result, 'Conversation retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export const messageController = new MessageController();
