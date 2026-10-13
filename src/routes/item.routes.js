import { Router } from 'express';
import { itemController } from '../controllers/item.controller.js';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Public item discovery endpoints
router.get('/', itemController.getFiltered);

// Protected provider endpoints (must be before /:id)
router.get(
  '/mine',
  authenticateToken,
  authorizeRoles('provider', 'admin'),
  itemController.getMine
);

// Public single item endpoint
router.get('/:id', itemController.getById);

// Protected item modification endpoints
router.post(
  '/',
  authenticateToken,
  authorizeRoles('provider', 'admin'),
  itemController.create
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('provider', 'admin'),
  itemController.update
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('provider', 'admin'),
  itemController.delete
);

export default router;
