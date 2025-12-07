import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CategoryIcon from '@mui/icons-material/Category';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RepeatIcon from '@mui/icons-material/Repeat';
import SavingsIcon from '@mui/icons-material/Savings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ReceiptIcon from '@mui/icons-material/Receipt';

const Sidebar = ({ isOpen, currentPage, onNavigate, toggleSidebar }) => {
  // Module configuration with icons and routes
  const modules = [
    { name: 'Dashboard', icon: DashboardIcon, route: '/dashboard' },
    { name: 'Categories', icon: CategoryIcon, route: '/categories' },
    { name: 'Expenses', icon: TrendingDownIcon, route: '/expenses' },
    { name: 'Income', icon: TrendingUpIcon, route: '/income' },
    { name: 'Budget', icon: AccountBalanceWalletIcon, route: '/budget' },
    { name: 'Recurring', icon: RepeatIcon, route: '/recurring' },
    { name: 'Savings', icon: SavingsIcon, route: '/savings' },
    { name: 'Loans', icon: CreditCardIcon, route: '/loans' },
    { name: 'Bills', icon: ReceiptIcon, route: '/bills' },
  ];

  // Handle module click
  const handleModuleClick = (module) => {
    console.log(`Navigating to: ${module.route}`);
    
    // Call onNavigate callback if provided
    if (onNavigate) {
      onNavigate(module.route);
    }
    
    // For production: navigate(module.route);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          style={{ marginTop: '64px' }}
          onClick={() => toggleSidebar && toggleSidebar()} // Close sidebar
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed left-0 bg-white transition-all duration-300 ease-in-out z-50`}
        style={{
          ...styles.sidebar,
          width: isOpen ? '220px' : '60px',
          top: '64px',
          height: 'calc(100vh - 64px)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        <nav style={styles.navContainer}>
          {modules.map((module, index) => {
            const Icon = module.icon;
            const isActive = currentPage === module.route;

            return (
              <div
                key={index}
                onClick={() => handleModuleClick(module)}
                style={{
                  ...styles.navItem,
                  ...(isActive && styles.navItemActive),
                }}
                className="sidebar-nav-item"
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #7E57C2 0%, #8E24AA 100%)';
                    e.currentTarget.style.color = '#FFFFFF';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#000000';
                  }
                }}
              >
                <Icon fontSize="small" style={styles.icon} />
                {isOpen && (
                  <span style={styles.navText}>{module.name}</span>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

const styles = {
  sidebar: {
    backgroundColor: '#FFFFFF',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.05)',
    overflowX: 'hidden',
    overflowY: 'auto',
    position: 'absolute',
    fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif',
  },
  navContainer: {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 0',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    margin: '4px 8px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    color: '#000000',
    fontSize: '15px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  navItemActive: {
    background: 'linear-gradient(135deg, #7E57C2 0%, #8E24AA 100%)',
    color: '#FFFFFF',
  },
  icon: {
    minWidth: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    flex: 1,
  },
};

export default Sidebar;