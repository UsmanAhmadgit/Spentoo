/**
 * Pre-fetch and cache user data after login
 * This improves performance by loading commonly used data in the background
 */

import { categoryApi } from "../api/categoryApi";
import { paymentMethodApi } from "../api/paymentMethodApi";

/**
 * Pre-fetch commonly used static data after login
 * This runs in the background and doesn't block navigation
 */
export const prefetchUserData = async () => {
  try {
    // Pre-fetch categories and payment methods in parallel
    // These are commonly used across multiple pages
    const promises = [
      categoryApi.getAll().catch(err => {
        console.warn("Failed to pre-fetch categories:", err);
        return null;
      }),
      paymentMethodApi.getAll().catch(err => {
        console.warn("Failed to pre-fetch payment methods:", err);
        return null;
      }),
    ];

    // Execute all pre-fetches in parallel (non-blocking)
    await Promise.allSettled(promises);
    
    // Data is now cached and ready for use
  } catch (error) {
    // Silently fail - pre-fetching is optional and shouldn't break login
    console.warn("Error pre-fetching user data:", error);
  }
};

/**
 * Clear all cached user data on logout
 */
export const clearUserDataCache = () => {
  // Clear all API cache entries
  const { apiCache } = require("../utils/apiCache");
  apiCache.clear();
};

