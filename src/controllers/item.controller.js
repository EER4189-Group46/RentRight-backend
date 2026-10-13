import { itemService } from '../services/item.service.js';
import { responseUtil } from '../utils/response.util.js';

/**
 * Item Controller: Handles HTTP requests for item search, filtering, and CRUD.
 */
class ItemController {
  /**
   * GET /api/items
   * Supports ?keyword=&category_id=&min_price=&max_price=&location=&sort=&status=
   */
  async getFiltered(req, res, next) {
    try {
      const items = await itemService.getFilteredItems(req.query);
      return responseUtil.success(res, items, 'Items retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/items/mine
   * Fetch current authenticated provider's items
   */
  async getMine(req, res, next) {
    try {
      const items = await itemService.getMyItems(req.user.id);
      return responseUtil.success(res, items, 'Your item listings retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/items/:id
   */
  async getById(req, res, next) {
    try {
      const item = await itemService.getItemById(req.params.id);
      return responseUtil.success(res, item, 'Item details retrieved successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/items
   */
  async create(req, res, next) {
    try {
      const newItem = await itemService.createItem(req.user.id, req.body);
      return responseUtil.success(res, newItem, 'Item listing created successfully.', 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/items/:id
   */
  async update(req, res, next) {
    try {
      const updatedItem = await itemService.updateItem(req.user.id, req.params.id, req.body);
      return responseUtil.success(res, updatedItem, 'Item listing updated successfully.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/items/:id
   */
  async delete(req, res, next) {
    try {
      const result = await itemService.deleteItem(req.user.id, req.params.id);
      return responseUtil.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }
}

export const itemController = new ItemController();
