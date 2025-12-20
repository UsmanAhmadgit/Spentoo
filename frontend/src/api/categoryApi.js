import axiosClient from "./axiosClient";
import { withCache, apiCache } from "../utils/apiCache";

// Cache categories for 30 minutes (static data)
const CACHE_TTL = 30 * 60 * 1000;

const getAllCategories = async () => {
  const response = await axiosClient.get("/categories");
  return response.data;
};

const getCategoriesByType = async (type) => {
  const response = await axiosClient.get(`/categories?type=${type}`);
  return response.data;
};

export const categoryApi = {
  getAll: withCache(
    getAllCategories,
    () => 'categories_all',
    CACHE_TTL
  ),

  getByType: withCache(
    getCategoriesByType,
    (type) => `categories_type_${type}`,
    CACHE_TTL
  ),
  
  // Invalidate cache when categories are modified
  invalidateCache: () => {
    // Invalidate all category-related cache entries
    // This will match keys like 'categories_all', 'categories_type_EXPENSE', etc.
    apiCache.invalidate('categories');
  },

  getById: async (id) => {
    const response = await axiosClient.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/categories", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/categories/${id}`);
    return response.data;
  },

  restore: async (id) => {
    const response = await axiosClient.put(`/categories/${id}/restore`, {});
    return response.data;
  },
};

