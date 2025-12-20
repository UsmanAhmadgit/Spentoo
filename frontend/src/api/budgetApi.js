import axiosClient from "./axiosClient";
import { withCache, apiCache } from "../utils/apiCache";

// Cache budgets for 5 minutes
const BUDGET_CACHE_TTL = 5 * 60 * 1000;

export const budgetApi = {
  getAll: withCache(
    async () => {
      const response = await axiosClient.get("/budgets");
      return response.data;
    },
    () => 'budgets_all',
    BUDGET_CACHE_TTL
  ),

  getById: async (id) => {
    const response = await axiosClient.get(`/budgets/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/budgets", data);
    apiCache.invalidate('budgets'); // Invalidate cache on create
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/budgets/${id}`, data);
    apiCache.invalidate('budgets'); // Invalidate cache on update
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/budgets/${id}`);
    apiCache.invalidate('budgets'); // Invalidate cache on delete
    return response.data;
  },
};

