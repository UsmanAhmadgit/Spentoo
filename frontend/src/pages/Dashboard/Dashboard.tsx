import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import SummaryCards from './SummaryCards';
import BarChartCard from './BarChartCard';
import PieChartCard from './PieChartCard';
import LowerCards from './LowerCards';
import { cn } from '../../lib/utils';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? saved === 'true' : false;
  });

  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', newState.toString());
  };
  const closeSidebar = () => {
    setSidebarOpen(false);
    localStorage.setItem('sidebarOpen', 'false');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <main
        className={cn(
          "pt-16 transition-all duration-300",
          sidebarOpen ? "lg:pl-56" : "lg:pl-0"
        )}
      >
        <div className="p-4 md:p-6 space-y-6">
          {/* Summary Cards */}
          <SummaryCards />

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BarChartCard />
            <PieChartCard />
          </div>

          {/* Lower Cards */}
          <LowerCards />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

