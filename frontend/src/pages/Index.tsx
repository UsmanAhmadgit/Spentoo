import { useState } from 'react';
import Navbar from './Dashboard/Navbar';
import Sidebar from './Dashboard/Sidebar';
import SummaryCards from './Dashboard/SummaryCards';
import BarChartCard from './Dashboard/BarChartCard';
import PieChartCard from './Dashboard/PieChartCard';
import LowerCards from './Dashboard/LowerCards';

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Content */}
      <main className="pt-16 lg:pl-0 transition-all duration-300">
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

export default Index;