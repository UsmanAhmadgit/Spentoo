import axiosClient from "./axiosClient";

export const paymentMethodApi = {
  getAll: async () => {
    const response = await axiosClient.get("/payment-methods");
    return response.data;
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

