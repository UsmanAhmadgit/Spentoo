import axiosClient from "./axiosClient";

export const incomeApi = {
  getAll: async () => {
    const response = await axiosClient.get("/income");
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosClient.get(`/income/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/income", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/income/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/income/${id}`);
    return response.data;
  },
};

