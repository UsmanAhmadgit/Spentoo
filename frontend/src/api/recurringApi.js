import axiosClient from "./axiosClient";
import { withCache, apiCache } from "../utils/apiCache";

// Cache recurring transactions for 5 minutes
const RECURRING_CACHE_TTL = 5 * 60 * 1000;

export const recurringApi = {
  getAll: withCache(
    async () => {
      const response = await axiosClient.get("/recurring-transactions");
      return response.data;
    },
    () => 'recurring_all',
    RECURRING_CACHE_TTL
  ),

  getById: async (id) => {
    const response = await axiosClient.get(`/recurring-transactions/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/recurring-transactions", data);
    apiCache.invalidate('recurring'); // Invalidate cache on create
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/recurring-transactions/${id}`, data);
    apiCache.invalidate('recurring'); // Invalidate cache on update
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/recurring-transactions/${id}`);
    apiCache.invalidate('recurring'); // Invalidate cache on delete
    return response.data;
  },

  pause: async (id) => {
    const response = await axiosClient.put(`/recurring-transactions/${id}/pause`, {});
    apiCache.invalidate('recurring'); // Invalidate cache on pause
    return response.data;
  },

  resume: async (id) => {
    const response = await axiosClient.put(`/recurring-transactions/${id}/resume`, {});
    apiCache.invalidate('recurring'); // Invalidate cache on resume
    return response.data;
  },

  triggerNow: async (id) => {
    const response = await axiosClient.post(`/recurring-transactions/${id}/trigger-now`, {});
    apiCache.invalidate('recurring'); // Invalidate cache on trigger
    return response.data;
  },

  getUpcoming: withCache(
    async () => {
      try {
        const response = await axiosClient.get("/recurring-transactions/upcoming");
        return response.data;
      } catch (error) {
        // If endpoint doesn't exist, return empty array
        return [];
      }
    },
    () => 'recurring_upcoming',
    RECURRING_CACHE_TTL
  ),
};

