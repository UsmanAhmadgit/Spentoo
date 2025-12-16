import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="auth-container">
      {/* Optional: add background, logo, or padding here */}
      <Outlet /> {/* This renders the page inside AuthLayout */}
    </div>
  );
};

export default AuthLayout;
