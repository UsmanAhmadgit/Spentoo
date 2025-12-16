import axiosClient from "./axiosClient";

export const billApi = {
  getAll: async () => {
    const response = await axiosClient.get("/bills");
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosClient.get(`/bills/${id}`);
    return response.data;
  },

  create: async (data) => {
    // Content-Type is handled by axiosClient interceptor
    const response = await axiosClient.post("/bills", data);
    return response.data;
  },

  update: async (id, data) => {
    // Content-Type is handled by axiosClient interceptor
    const response = await axiosClient.put(`/bills/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/bills/${id}`);
    return response.data;
  },
};

