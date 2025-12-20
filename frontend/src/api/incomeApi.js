import axiosClient from "./axiosClient";
import { withCache, apiCache } from "../utils/apiCache";

// Cache income for 5 minutes
const INCOME_CACHE_TTL = 5 * 60 * 1000;

const getAllIncome = async (filter = null, startDate = null, endDate = null) => {
    const params = {};
    if (startDate && endDate) {
      params.startDate = startDate.split('T')[0];
      params.endDate = endDate.split('T')[0];
    } else if (filter) {
      params.filter = filter;
    }
    const response = await axiosClient.get("/income", { params });
    return response.data;
};

export const incomeApi = {
  getAll: withCache(
    getAllIncome,
    (filter, startDate, endDate) => {
      const params = { filter, startDate, endDate };
      return `income_all_${JSON.stringify(params)}`;
    },
    INCOME_CACHE_TTL
  ),

  getById: async (id) => {
    const response = await axiosClient.get(`/income/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/income", data);
    apiCache.invalidate('income'); // Invalidate cache on create
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/income/${id}`, data);
    apiCache.invalidate('income'); // Invalidate cache on update
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/income/${id}`);
    apiCache.invalidate('income'); // Invalidate cache on delete
    return response.data;
  },
};

