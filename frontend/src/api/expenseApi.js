import axiosClient from "./axiosClient";

export const expenseApi = {
  getAll: async () => {
    const response = await axiosClient.get("/expenses");
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosClient.get(`/expenses/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/expenses", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/expenses/${id}`);
    return response.data;
  },
};

