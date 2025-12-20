import axiosClient from "./axiosClient";
import { withCache, apiCache } from "../utils/apiCache";

// Cache goals for 5 minutes (data changes when transactions are added)
const GOAL_CACHE_TTL = 5 * 60 * 1000;

export const savingsApi = {
  getAll: withCache(
    async () => {
      const response = await axiosClient.get("/goals");
      return response.data;
    },
    () => 'goals_all',
    GOAL_CACHE_TTL
  ),

  getById: async (id) => {
    const response = await axiosClient.get(`/goals/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/goals", data);
    apiCache.invalidate('goals'); // Invalidate cache on create
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/goals/${id}`, data);
    apiCache.invalidate('goals'); // Invalidate cache on update
    return response.data;
  },

  delete: async (id) => {
    await axiosClient.delete(`/goals/${id}`);
    apiCache.invalidate('goals'); // Invalidate cache on delete
    return { success: true };
  },
};

