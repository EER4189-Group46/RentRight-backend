import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// All payment routes require authentication
router.use(authenticateToken);

// Renter endpoints: process payment and payment receipts history
router.post('/', paymentController.create);
router.get('/mine', paymentController.getMine);

// Provider endpoints: revenue analytics and payout history
router.get(
  '/earnings',
  authorizeRoles('provider', 'admin'),
  paymentController.getEarnings
);

export default router;
