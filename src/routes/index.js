import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import categoryRoutes from './category.routes.js';
import itemRoutes from './item.routes.js';
import rentalRequestRoutes from './rental-request.routes.js';
import paymentRoutes from './payment.routes.js';

const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'RentRight API is running.',
    timestamp: new Date().toISOString(),
  });
});

// Mount modules
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/items', itemRoutes);
apiRouter.use('/rental-requests', rentalRequestRoutes);
apiRouter.use('/payments', paymentRoutes);

export default apiRouter;
