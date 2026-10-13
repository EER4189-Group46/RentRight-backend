import { userService } from '../services/user.service.js';
import { responseUtil } from '../utils/response.util.js';

/**
 * Controller: Handles incoming HTTP requests for user profiles.
 */
class UserController {
  /**
   * Get current authenticated user details
   * GET /api/users/me
   */
  async getMe(req, res, next) {
    try {
      const user = await userService.getProfile(req.user.id);
      return responseUtil.success(res, user, 'Profile fetched successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update current authenticated user profile
   * PUT /api/users/me
   */
  async updateMe(req, res, next) {
    try {
      const updatedUser = await userService.updateProfile(req.user.id, req.body);
      return responseUtil.success(res, updatedUser, 'Profile updated successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
