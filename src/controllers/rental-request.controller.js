import { rentalRequestService } from '../services/rental-request.service.js';
import { responseUtil } from '../utils/response.util.js';

/**
 * Rental Request Controller: Handles HTTP endpoints for rental requests.
 */
class RentalRequestController {
  /**
   * POST /api/rental-requests
   * Create new rental request for an item
   */
  async create(req, res, next) {
    try {
      const request = await rentalRequestService.createRequest(req.user.id, req.body);
      return responseUtil.success(
        res,
        request,
        'Rental request submitted successfully. Awaiting provider approval.',
        201
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/rental-requests/mine
   * Fetch current renter's submitted rental requests
   */
  async getMine(req, res, next) {
    try {
      const requests = await rentalRequestService.getRenterRequests(req.user.id);
      return responseUtil.success(res, requests, 'Rental requests retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/rental-requests/provider
   * Fetch incoming rental requests for items owned by current provider
   */
  async getForProvider(req, res, next) {
    try {
      const requests = await rentalRequestService.getProviderRequests(req.user.id);
      return responseUtil.success(res, requests, 'Incoming rental requests retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/rental-requests/:id/status
   * Provider approves or rejects incoming rental request
   */
  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const updated = await rentalRequestService.updateStatus(req.user.id, req.params.id, status);
      return responseUtil.success(res, updated, `Rental request marked as '${status}'.`);
    } catch (err) {
      next(err);
    }
  }
/**
   * PUT /api/rental-requests/:id/cancel
   * Renter cancels an eligible rental request
   */
  async cancel(req, res, next) {
    try {
      const cancelled = await rentalRequestService.cancelRequest(
        req.user.id,
        req.params.id
      );

      return responseUtil.success(
        res,
        cancelled,
        'Rental request cancelled successfully.'
      );
    } catch (err) {
      next(err);
    }
  }

  
}

export const rentalRequestController = new RentalRequestController();
