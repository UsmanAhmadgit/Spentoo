import axiosClient from "./axiosClient";
import { withCache, apiCache } from "../utils/apiCache";

// Cache payment methods for 30 minutes (static data)
const CACHE_TTL = 30 * 60 * 1000;

const getAllPaymentMethods = async () => {
  const response = await axiosClient.get("/payment-methods");
  return response.data;
};

export const paymentMethodApi = {
  getAll: withCache(
    getAllPaymentMethods,
    () => 'payment_methods_all',
    CACHE_TTL
  ),
  
  // Invalidate cache when payment methods are modified
  invalidateCache: () => {
    apiCache.invalidate('payment_methods');
  },

  getAllIncludingInactive: async () => {
    const response = await axiosClient.get("/payment-methods/all");
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosClient.get(`/payment-methods/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/payment-methods", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/payment-methods/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/payment-methods/${id}`);
    return response.data;
  },
};

