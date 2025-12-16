import axiosClient from "./axiosClient";

export const userApi = {
  getProfile: async () => {
    const response = await axiosClient.get("/user/profile");
    return response.data;
  },

  logout: async () => {
    const response = await axiosClient.post("/user/logout", {});
    return response.data;
  },
};

