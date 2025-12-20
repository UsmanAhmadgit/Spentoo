import React, { createContext, useState, useMemo, useEffect } from "react";
import { prefetchUserData, clearUserDataCache } from "../utils/prefetchUserData";
import { userApi } from "../api/userApi";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("authUser");
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.warn("Failed to parse auth user from storage", err);
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("authToken"));
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const stored = localStorage.getItem("userProfile");
      return stored ? JSON.parse(stored) : null;
    } catch (err) {
      console.warn("Failed to parse user profile from storage", err);
      return null;
    }
  });

  // Fetch user profile once when user is authenticated and profile is not loaded
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && token && !userProfile) {
        try {
          const profile = await userApi.getProfile();
          setUserProfile(profile);
          localStorage.setItem("userProfile", JSON.stringify(profile));
        } catch (error) {
          console.warn("Failed to fetch user profile:", error);
        }
      }
    };

    fetchUserProfile();
  }, [user, token, userProfile]);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("authUser", JSON.stringify(userData));
    if (authToken) {
      localStorage.setItem("authToken", authToken);
    }
    
    // Clear old profile to fetch fresh one after login
    setUserProfile(null);
    localStorage.removeItem("userProfile");
    
    // Pre-fetch commonly used data in the background (non-blocking)
    prefetchUserData().catch(() => {
      // Silently handle errors - pre-fetching shouldn't break login
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUserProfile(null);
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userProfile");
    
    // Clear all cached data on logout for security
    clearUserDataCache();
  };

  const isAuthenticated = !!user; // boolean true if user exists

  const value = useMemo(
    () => ({ user, token, userProfile, login, logout, isAuthenticated }),
    [user, token, userProfile, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

