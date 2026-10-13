import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';

const router = Router();

// Public category routes
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);

export default router;
