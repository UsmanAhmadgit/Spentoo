import axiosClient from "./axiosClient";

export const categoryApi = {
  getAll: async () => {
    const response = await axiosClient.get("/categories");
    return response.data;
  },

  getByType: async (type) => {
    const response = await axiosClient.get(`/categories?type=${type}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await axiosClient.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await axiosClient.post("/categories", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await axiosClient.put(`/categories/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await axiosClient.delete(`/categories/${id}`);
    return response.data;
  },

  restore: async (id) => {
    const response = await axiosClient.put(`/categories/${id}/restore`, {});
    return response.data;
  },

  export: async () => {
    const response = await axiosClient.get("/categories/export", {
      responseType: 'blob'
    });
    return response.data;
  },
};

