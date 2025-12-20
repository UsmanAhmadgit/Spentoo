import axiosClient from "./axiosClient";
import { withCache, apiCache } from "../utils/apiCache";

// Cache bills for 5 minutes
const BILL_CACHE_TTL = 5 * 60 * 1000;

const getAllBills = async (filter = null, startDate = null, endDate = null) => {
    const params = {};
    if (startDate && endDate) {
      params.startDate = startDate.split('T')[0];
      params.endDate = endDate.split('T')[0];
    } else if (filter) {
      params.filter = filter;
    }
    const response = await axiosClient.get("/bills", { params });
    return response.data;
};

export const billApi = {
  getAll: withCache(
    getAllBills,
    (filter, startDate, endDate) => {
      const params = { filter, startDate, endDate };
      return `bills_all_${JSON.stringify(params)}`;
    },
    BILL_CACHE_TTL
  ),

  getById: async (id) => {
    const response = await axiosClient.get(`/bills/${id}`);
    return response.data;
  },

  create: async (data) => {
    // Content-Type is handled by axiosClient interceptor
    const response = await axiosClient.post("/bills", data);
    apiCache.invalidate('bills'); // Invalidate cache on create
    return response.data;
  },

  update: async (id, data) => {
    // Content-Type is handled by axiosClient interceptor
    const response = await axiosClient.put(`/bills/${id}`, data);
    apiCache.invalidate('bills'); // Invalidate cache on update
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/bills/${id}`);
    apiCache.invalidate('bills'); // Invalidate cache on delete
    return response.data;
  },
};

