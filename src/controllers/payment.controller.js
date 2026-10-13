import { paymentService } from '../services/payment.service.js';
import { responseUtil } from '../utils/response.util.js';

/**
 * Payment Controller: Handles HTTP endpoints for payments and revenue tracking.
 */
class PaymentController {
  /**
   * POST /api/payments
   * Process simulated payment for an approved rental request
   */
  async create(req, res, next) {
    try {
      const payment = await paymentService.processPayment(req.user.id, req.body);
      return responseUtil.success(
        res,
        payment,
        'Payment completed successfully. Your rental booking is confirmed!',
        201
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/payments/mine
   * Fetch payment receipts history for authenticated renter
   */
  async getMine(req, res, next) {
    try {
      const payments = await paymentService.getMyPayments(req.user.id);
      return responseUtil.success(res, payments, 'Payment history retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/payments/earnings
   * Fetch revenue statistics and payout history for authenticated provider
   */
  async getEarnings(req, res, next) {
    try {
      const earnings = await paymentService.getProviderEarnings(req.user.id);
      return responseUtil.success(res, earnings, 'Provider earnings retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export const paymentController = new PaymentController();
