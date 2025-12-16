import axios from "axios";

// Base axios client for API calls. Update REACT_APP_API_BASE_URL to point at the
// Spring Boot backend (e.g., https://api.myapp.com).
const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api",
});

// Attach auth token if present and fix Content-Type header
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Force Content-Type to be exactly 'application/json' without charset
  // This prevents axios from automatically adding charset=UTF-8
  if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData) && !(config.data instanceof URLSearchParams)) {
    // Manually stringify the data to prevent axios from adding charset
    config.data = JSON.stringify(config.data);
    // Remove any existing Content-Type header (including charset variants)
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
    // Set it explicitly without charset
    config.headers['Content-Type'] = 'application/json';
  }
  
  return config;
});

// Response interceptor for handling errors
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log error details for debugging
    if (error.response) {
      console.error('API Error:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url
      });
    }

    // If error is 401/403, token is invalid/expired - logout user
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear auth data
      localStorage.removeItem("authToken");
      localStorage.removeItem("authUser");
      // Redirect to login if not already there
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
    }

    // For 400 errors, extract validation messages
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      if (errorData && typeof errorData === 'object') {
        // Backend returns Map<String, String> for validation errors
        // Keys are field names, values are error messages
        if (Object.keys(errorData).length > 0) {
          // Extract all validation error messages
          const errorMessages = Object.values(errorData).filter(msg => msg);
          if (errorMessages.length > 0) {
            error.message = errorMessages.join(', ');
            error.validationErrors = errorData; // Store field-specific errors
          } else if (errorData.message) {
            error.message = errorData.message;
          }
        } else if (errorData.message) {
          error.message = errorData.message;
        }
      } else if (typeof errorData === 'string') {
        error.message = errorData;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;

