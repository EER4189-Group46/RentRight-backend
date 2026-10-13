import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// All user routes require authentication
router.use(authenticateToken);

router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);

export default router;
