import { Router } from 'express';
import { messageController } from '../controllers/message.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// All message routes require authentication
router.use(authenticateToken);

/**
 * GET /api/messages/conversations
 * Returns all conversation thread summaries for the logged-in user.
 * NOTE: This route must be defined BEFORE /:otherUserId to avoid route ambiguity.
 */
router.get('/conversations', (req, res, next) => messageController.listConversations(req, res, next));

/**
 * POST /api/messages
 * Send a new message. Body: { receiver_id, content, item_id? }
 */
router.post('/', (req, res, next) => messageController.send(req, res, next));

/**
 * GET /api/messages/:otherUserId
 * Retrieve the full chat thread with a given user.
 */
router.get('/:otherUserId', (req, res, next) => messageController.getConversation(req, res, next));

export default router;
