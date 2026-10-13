import { rentalRequestRepository } from '../repositories/rental-request.repository.js';
import { itemRepository } from '../repositories/item.repository.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';

/**
 * Rental Request Service: Handles rental request creation, approval, and validations.
 */
class RentalRequestService {
  /**
   * Create a new rental request for an item.
   * @param {number|string} renterId 
   * @param {object} data 
   * @returns {Promise<object>}
   */
  async createRequest(renterId, data) {
    const { item_id, start_date, end_date } = data;

    if (!item_id) {
      throw new BadRequestError('Item ID is required.');
    }

    if (!start_date || !end_date) {
      throw new BadRequestError('Please provide both rental start and end dates.');
    }

    const start = new Date(start_date);
    const end = new Date(end_date);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('Invalid date format provided.');
    }

    if (end < start) {
      throw new BadRequestError('End date cannot be earlier than start date.');
    }

    const item = await itemRepository.findById(item_id);
    if (!item) {
      throw new NotFoundError('Requested rental item not found.');
    }

    if (item.status !== 'available') {
      throw new BadRequestError('This item is currently not available for rent.');
    }

    if (item.provider_id === renterId) {
      throw new BadRequestError('You cannot submit a rental request for your own listed item.');
    }

    const request = await rentalRequestRepository.create({
      item_id,
      renter_id: renterId,
      start_date,
      end_date,
      status: 'pending',
    });

    return request;
  }

  /**
   * Get all rental requests submitted by a renter.
   * @param {number|string} renterId 
   * @returns {Promise<Array>}
   */
  async getRenterRequests(renterId) {
    return rentalRequestRepository.findByRenterId(renterId);
  }

  /**
   * Get all incoming rental requests for items owned by a provider.
   * @param {number|string} providerId 
   * @returns {Promise<Array>}
   */
  async getProviderRequests(providerId) {
    return rentalRequestRepository.findByProviderId(providerId);
  }

  /**
   * Provider action: Accept or reject a rental request.
   * @param {number|string} providerId 
   * @param {number|string} requestId 
   * @param {string} status ('accepted' | 'rejected')
   * @returns {Promise<object>}
   */
  async updateStatus(providerId, requestId, status) {
    const validStatuses = ['accepted', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const request = await rentalRequestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundError('Rental request not found.');
    }

    if (request.provider_id !== providerId) {
      throw new ForbiddenError('You do not have permission to manage this rental request.');
    }

    return rentalRequestRepository.updateStatus(requestId, status);
  }
}

export const rentalRequestService = new RentalRequestService();
