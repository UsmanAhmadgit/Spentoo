import axiosClient from "./axiosClient";

export const recurringApi = {
  getAll: async () => {
    const response = await axiosClient.get("/recurring-transactions");
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosClient.get(`/recurring-transactions/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/recurring-transactions", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/recurring-transactions/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/recurring-transactions/${id}`);
    return response.data;
  },

  pause: async (id) => {
    const response = await axiosClient.put(`/recurring-transactions/${id}/pause`, {});
    return response.data;
  },

  resume: async (id) => {
    const response = await axiosClient.put(`/recurring-transactions/${id}/resume`, {});
    return response.data;
  },

  triggerNow: async (id) => {
    const response = await axiosClient.post(`/recurring-transactions/${id}/trigger-now`, {});
    return response.data;
  },

  getUpcoming: async () => {
    try {
      const response = await axiosClient.get("/recurring-transactions/upcoming");
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, return empty array
      return [];
    }
  },
};

