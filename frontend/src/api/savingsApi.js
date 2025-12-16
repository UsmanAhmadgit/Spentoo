import axiosClient from "./axiosClient";

export const savingsApi = {
  getAll: async () => {
    const response = await axiosClient.get("/goals");
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosClient.get(`/goals/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/goals", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/goals/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    await axiosClient.delete(`/goals/${id}`);
    return { success: true };
  },
};

