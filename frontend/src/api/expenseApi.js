import axiosClient from "./axiosClient";
import { withCache, apiCache } from "../utils/apiCache";

// Cache expenses for 5 minutes
const EXPENSE_CACHE_TTL = 5 * 60 * 1000;

const getAllExpenses = async (filter = null, startDate = null, endDate = null) => {
    const params = {};
    if (startDate && endDate) {
      // Ensure dates are in YYYY-MM-DD format
      params.startDate = startDate.split('T')[0]; // Remove time if present
      params.endDate = endDate.split('T')[0]; // Remove time if present
    } else if (filter) {
      params.filter = filter;
    }
    const response = await axiosClient.get("/expenses", { params });
    return response.data;
};

export const expenseApi = {
  getAll: withCache(
    getAllExpenses,
    (filter, startDate, endDate) => {
      const params = { filter, startDate, endDate };
      return `expenses_all_${JSON.stringify(params)}`;
    },
    EXPENSE_CACHE_TTL
  ),

  getById: async (id) => {
    const response = await axiosClient.get(`/expenses/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/expenses", data);
    apiCache.invalidate('expenses'); // Invalidate cache on create
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/expenses/${id}`, data);
    apiCache.invalidate('expenses'); // Invalidate cache on update
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/expenses/${id}`);
    apiCache.invalidate('expenses'); // Invalidate cache on delete
    return response.data;
  },
};

