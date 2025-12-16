import React, { createContext, useState, useMemo } from "react";

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

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("authUser", JSON.stringify(userData));
    if (authToken) {
      localStorage.setItem("authToken", authToken);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
  };

  const isAuthenticated = !!user; // boolean true if user exists

  const value = useMemo(
    () => ({ user, token, login, logout, isAuthenticated }),
    [user, token, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

