import { categoryService } from '../services/category.service.js';
import { responseUtil } from '../utils/response.util.js';

/**
 * Category Controller: Handles HTTP endpoints for categories.
 */
class CategoryController {
  /**
   * GET /api/categories
   */
  async getAll(req, res, next) {
    try {
      const categories = await categoryService.getAllCategories();
      return responseUtil.success(res, categories, 'Categories fetched successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/categories/:id
   */
  async getById(req, res, next) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      return responseUtil.success(res, category, 'Category fetched successfully.');
    } catch (err) {
      next(err);
    }
  }
}

export const categoryController = new CategoryController();
