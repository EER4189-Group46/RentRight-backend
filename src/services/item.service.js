import { itemRepository } from '../repositories/item.repository.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors.js';

/**
 * Item Service: Handles item business logic, filtering rules, and ownership validation.
 */
class ItemService {
  /**
   * Search and filter rental items with query parameters.
   * @param {object} filters 
   * @returns {Promise<Array>}
   */
  async getFilteredItems(filters = {}) {
    const cleanFilters = {};

    if (filters.keyword && typeof filters.keyword === 'string') {
      cleanFilters.keyword = filters.keyword.trim();
    }

    if (filters.category_id) {
      const catId = parseInt(filters.category_id, 10);
      if (!isNaN(catId) && catId > 0) {
        cleanFilters.category_id = catId;
      }
    }

    if (filters.min_price !== undefined && filters.min_price !== '') {
      const min = parseFloat(filters.min_price);
      if (!isNaN(min) && min >= 0) {
        cleanFilters.min_price = min;
      }
    }

    if (filters.max_price !== undefined && filters.max_price !== '') {
      const max = parseFloat(filters.max_price);
      if (!isNaN(max) && max >= 0) {
        cleanFilters.max_price = max;
      }
    }

    if (filters.location && typeof filters.location === 'string') {
      cleanFilters.location = filters.location.trim();
    }

    if (filters.status) {
      cleanFilters.status = filters.status;
    }

    if (filters.sort && ['newest', 'price_asc', 'price_desc'].includes(filters.sort)) {
      cleanFilters.sort = filters.sort;
    } else {
      cleanFilters.sort = 'newest';
    }

    return itemRepository.findFiltered(cleanFilters);
  }

  /**
   * Get single item details by ID.
   * @param {number|string} id 
   * @returns {Promise<object>}
   */
  async getItemById(id) {
    const item = await itemRepository.findById(id);
    if (!item) {
      throw new NotFoundError('Item not found.');
    }
    return item;
  }

  /**
   * Get all items listed by a provider.
   * @param {number|string} providerId 
   * @returns {Promise<Array>}
   */
  async getMyItems(providerId) {
    return itemRepository.findByProviderId(providerId);
  }

  /**
   * Create a new item listing for a provider.
   * @param {number|string} providerId 
   * @param {object} itemData 
   * @returns {Promise<object>}
   */
  async createItem(providerId, itemData) {
    const { name, category_id, price_per_day, location } = itemData;

    if (!name || !name.trim()) {
      throw new BadRequestError('Item name is required.');
    }

    if (!category_id) {
      throw new BadRequestError('Category is required.');
    }

    const category = await categoryRepository.findById(category_id);
    if (!category) {
      throw new BadRequestError('Invalid category ID.');
    }

    const price = parseFloat(price_per_day);
    if (isNaN(price) || price < 0) {
      throw new BadRequestError('A valid price per day is required.');
    }

    if (!location || !location.trim()) {
      throw new BadRequestError('Item location is required.');
    }

    return itemRepository.create({
      ...itemData,
      provider_id: providerId,
    });
  }

  /**
   * Update an item listing (only by the owner or admin).
   * @param {number|string} providerId 
   * @param {number|string} itemId 
   * @param {object} updateData 
   * @returns {Promise<object>}
   */
  async updateItem(providerId, itemId, updateData) {
    const existing = await itemRepository.findById(itemId);
    if (!existing) {
      throw new NotFoundError('Item not found.');
    }

    if (existing.provider_id !== providerId) {
      throw new ForbiddenError('You do not have permission to modify this listing.');
    }

    if (updateData.category_id) {
      const category = await categoryRepository.findById(updateData.category_id);
      if (!category) {
        throw new BadRequestError('Invalid category ID.');
      }
    }

    const updated = await itemRepository.update(itemId, updateData);
    return updated;
  }

  /**
   * Delete an item listing (only by the owner or admin).
   * @param {number|string} providerId 
   * @param {number|string} itemId 
   * @returns {Promise<{ message: string }>}
   */
  async deleteItem(providerId, itemId) {
    const existing = await itemRepository.findById(itemId);
    if (!existing) {
      throw new NotFoundError('Item not found.');
    }

    if (existing.provider_id !== providerId) {
      throw new ForbiddenError('You do not have permission to delete this listing.');
    }

    await itemRepository.delete(itemId);
    return { message: 'Item listing deleted successfully.' };
  }
}

export const itemService = new ItemService();
