import axiosClient from "./axiosClient";

export const loginHistoryApi = {
  getAll: async () => {
    try {
      // If backend has a login history endpoint, use it
      const response = await axiosClient.get("/user/login-history");
      return response.data;
    } catch (error) {
      // If endpoint doesn't exist, return empty array
      console.warn("Login history endpoint not available");
      return [];
    }
  },

  getRecent: async (limit = 10) => {
    try {
      const response = await axiosClient.get(`/user/login-history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.warn("Login history endpoint not available");
      return [];
    }
  },
};

