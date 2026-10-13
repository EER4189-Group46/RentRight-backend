import { categoryRepository } from '../repositories/category.repository.js';
import { NotFoundError } from '../utils/errors.js';

/**
 * Category Service: Handles category business logic.
 */
class CategoryService {
  /**
   * Get all active categories.
   * @returns {Promise<Array>}
   */
  async getAllCategories() {
    return categoryRepository.findAll();
  }

  /**
   * Get category by ID.
   * @param {number|string} id 
   * @returns {Promise<object>}
   */
  async getCategoryById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found.');
    }
    return category;
  }
}

export const categoryService = new CategoryService();
