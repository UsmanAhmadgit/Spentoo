import axiosClient from "./axiosClient";

export const budgetApi = {
  getAll: async () => {
    const response = await axiosClient.get("/budgets");
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosClient.get(`/budgets/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/budgets", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/budgets/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/budgets/${id}`);
    return response.data;
  },
};

