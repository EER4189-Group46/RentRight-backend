import { Router } from 'express';
import { rentalRequestController } from '../controllers/rental-request.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// All rental request routes require authentication
router.use(authenticateToken);

// Renter endpoints
router.post('/', rentalRequestController.create);
router.get('/mine', rentalRequestController.getMine);

// Provider endpoints
router.get(
  '/provider',
  authorizeRoles('provider', 'admin'),
  rentalRequestController.getForProvider
);

router.put(
  '/:id/status',
  authorizeRoles('provider', 'admin'),
  rentalRequestController.updateStatus
);

export default router;
