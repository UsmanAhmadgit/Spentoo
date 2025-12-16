import axiosClient from "./axiosClient";

// Auth API wrapper. Adjust endpoint paths if your Spring Boot routes differ.
export const authApi = {
  login: async ({ loginMethod, username, email, password }) => {
    // Backend only accepts email for login (not username)
    // If user selected username, we need to convert it or handle differently
    const payload = {
      email: loginMethod === "email" ? email : username, // Use email field for both
      password,
    };

    const response = await axiosClient.post("/auth/login", payload);
    return response.data;
  },

  register: async ({ username, email, password, firstName, lastName, country, confirmPassword }) => {
    const payload = {
      username,
      email,
      password,
      firstName: firstName || username, // Use username as firstName if not provided
      lastName: lastName || "", // Use empty string if not provided
      country: country || "US", // Default to US if not provided
      confirmPassword: confirmPassword || password, // Use password as confirmPassword if not provided
    };

    const response = await axiosClient.post("/auth/register", payload);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await axiosClient.post("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (token, newPassword, confirmPassword) => {
    const response = await axiosClient.post("/auth/reset-password", {
      token,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },

  verifyEmail: async (token) => {
    const response = await axiosClient.post("/auth/verify-email", { token });
    return response.data;
  },
};

