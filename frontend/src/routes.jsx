import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';

// Dashboard (protected)
import Dashboard from './pages/Dashboard/Dashboard';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';

// Hooks / Context
import { useAuth } from './hooks/useAuth';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  console.log('ProtectedRoute check - isAuthenticated:', isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
  console.log('AppRoutes rendering');
  
  return (
    <Routes>
      {/* Default route / redirect to Register */}
      <Route path="/" element={<Navigate to="/register" />} />

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>

      {/* Protected routes */}
      <Route element={<MainLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all redirect to register */}
      <Route path="*" element={<Navigate to="/register" />} />
    </Routes>
  );
};

export default AppRoutes;