import { paymentRepository } from '../repositories/payment.repository.js';
import { rentalRequestRepository } from '../repositories/rental-request.repository.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';

/**
 * Payment Service: Handles payment processing, receipts, and earnings analytics.
 * Supports the simulated checkout workflow for the RentRight platform.
 */
class PaymentService {
  /**
   * Process a simulated payment for an accepted rental request.
   * @param {number|string} renterId 
   * @param {object} payload 
   * @returns {Promise<object>}
   */
  async processPayment(renterId, payload) {
    const { rental_request_id, payment_method = 'card' } = payload;

    if (!rental_request_id) {
      throw new BadRequestError('Rental request ID is required.');
    }

    const request = await rentalRequestRepository.findById(rental_request_id);
    if (!request) {
      throw new NotFoundError('Rental request not found.');
    }

    if (request.renter_id !== renterId) {
      throw new ForbiddenError('You can only pay for your own rental requests.');
    }

    if (request.status !== 'accepted') {
      if (request.status === 'pending') {
        throw new BadRequestError('This rental request is pending approval by the provider. You can make payment once accepted.');
      }
      throw new BadRequestError(`Cannot pay for this request because its status is '${request.status}'.`);
    }

    // Check if already paid
    const existingPayment = await paymentRepository.findByRentalRequestId(rental_request_id);
    if (existingPayment) {
      throw new BadRequestError('Payment has already been completed for this rental booking.');
    }

    // Calculate total duration and amount
    const start = new Date(request.start_date);
    const end = new Date(request.end_date);
    const diffTime = Math.abs(end - start);
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const amount = days * parseFloat(request.price_per_day);

    // Generate unique transaction ID
    const transaction_id = `RR-SIM-${Date.now()}-${Math.floor(Math.random() * 90000 + 10000)}`;

    const newPayment = await paymentRepository.create({
      rental_request_id,
      user_id: renterId,
      amount,
      payment_method,
      transaction_id,
      status: 'completed',
    });

    return {
      payment_id: newPayment.id,
      rental_request_id: request.id,
      transaction_id: newPayment.transaction_id,
      amount: newPayment.amount,
      days,
      item_name: request.item_name,
      payment_method: newPayment.payment_method,
      status: newPayment.status,
      paid_at: newPayment.created_at,
    };
  }

  /**
   * Get payment history for an authenticated renter.
   * @param {number|string} renterId 
   * @returns {Promise<Array>}
   */
  async getMyPayments(renterId) {
    return paymentRepository.findByUserId(renterId);
  }

  /**
   * Get earnings dashboard metrics and payout history for a provider.
   * @param {number|string} providerId 
   * @returns {Promise<object>}
   */
  async getProviderEarnings(providerId) {
    const payments = await paymentRepository.findEarningsByProviderId(providerId);

    const total_earnings = payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const completed_rentals_count = payments.length;
    const avg_booking_value = completed_rentals_count > 0
      ? Math.round((total_earnings / completed_rentals_count) * 100) / 100
      : 0;

    return {
      total_earnings,
      completed_rentals_count,
      avg_booking_value,
      payments,
    };
  }
}

export const paymentService = new PaymentService();
