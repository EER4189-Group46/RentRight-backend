import { userRepository } from '../repositories/user.repository.js';
import { sanitizeUser } from './auth.service.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * User Service: Handles user profile queries and updates.
 */
class UserService {
  /**
   * Get user profile by ID.
   * @param {number|string} id 
   * @returns {Promise<object>}
   */
  async getProfile(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    return sanitizeUser(user);
  }

  /**
   * Update user profile information.
   * @param {number|string} id 
   * @param {object} updateData 
   * @returns {Promise<object>}
   */
  async updateProfile(id, updateData) {
    const updatedUser = await userRepository.update(id, updateData);
    if (!updatedUser) {
      throw new NotFoundError('User not found.');
    }
    return sanitizeUser(updatedUser);
  }
}

export const userService = new UserService();
