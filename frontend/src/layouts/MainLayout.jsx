import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        currentPage={location.pathname}
        onNavigate={(route) => navigate(route)}
      />

      {/* Main content area */}
      <div className="flex-1 min-h-screen bg-gray-100">
        {/* Navbar */}
        <Navbar onToggleSidebar={toggleSidebar} onNavigate={(route) => navigate(route)} />

        {/* Page content */}
        <main className="p-4 mt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
