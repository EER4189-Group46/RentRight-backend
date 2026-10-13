import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validateAuth } from '../middlewares/validate.middleware.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', validateAuth.register, authController.register);
router.post('/login', validateAuth.login, authController.login);
router.post('/forgot-password', validateAuth.forgotPassword, authController.forgotPassword);
router.post('/reset-password', validateAuth.resetPassword, authController.resetPassword);

// Protected routes (requires Bearer token)
router.post('/change-password', authenticateToken, validateAuth.changePassword, authController.changePassword);

export default router;
