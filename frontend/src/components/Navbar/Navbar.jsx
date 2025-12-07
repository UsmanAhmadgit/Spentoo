import React, { useState, useEffect, useRef } from 'react';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LockResetIcon from '@mui/icons-material/LockReset';
import LogoutIcon from '@mui/icons-material/Logout';

const Navbar = ({ onToggleSidebar, onNavigate }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const dropdownRef = useRef(null);

  // Mock username - will be replaced with real data from AuthContext/API
  // In production: const username = useContext(AuthContext).user.name || sessionStorage.getItem('username');
  const username = sessionStorage.getItem("username") || "User";


  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showDropdown) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
  }, [showDropdown]);

  // Toggle sidebar
  const toggleSidebar = () => {
    console.log('Sidebar toggled');
    if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  // Toggle dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Handle Reset Password
  const handleResetPassword = () => {
    setShowDropdown(false);
    // For demo: navigate using window.location or pass through props
   onNavigate('/reset-password/dummy-token');
  };

  // Handle Logout
  const handleLogout = () => {
    setShowDropdown(false);
    // Clear session storage
    sessionStorage.clear();
    console.log('User logged out, session cleared');
    // Redirect to login
    onNavigate('/login');

  };

  return (
    <nav className="fixed top-0 left-0 right-0 shadow-md" style={styles.navbar}>
      <div style={styles.container}>
        {/* Left: Hamburger Menu */}
        <div style={styles.left}>
          <button
            onClick={toggleSidebar}
            style={styles.menuButton}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            aria-label="Toggle Sidebar"
          >
            <MenuIcon fontSize="medium" />
          </button>
        </div>

        {/* Center: Logo */}
        <div style={styles.center}>
          <h1 style={{
            ...styles.logo,
            fontSize: isMobile ? '20px' : 'clamp(20px, 3vw, 28px)'
          }}>
            SPENTOO
          </h1>
        </div>

        {/* Right: User Menu */}
        <div style={styles.right} ref={dropdownRef}>
          <div
            onClick={toggleDropdown}
            style={styles.userMenu}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <AccountCircleIcon fontSize="medium" style={styles.userIcon} />
            {!isMobile && (
              <span style={styles.username}>{username}</span>
            )}
            <KeyboardArrowDownIcon
              fontSize="small"
              style={{
                ...styles.chevronIcon,
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div style={{
              ...styles.dropdown,
              right: isMobile ? '0' : 'auto'
            }}>
              <button
                onClick={handleResetPassword}
                style={styles.dropdownButton}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3E5F5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LockResetIcon fontSize="small" style={styles.dropdownIcon} />
                <span>Reset Password</span>
              </button>

              <div style={styles.divider} />

              <button
                onClick={handleLogout}
                style={styles.dropdownButton}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3E5F5'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogoutIcon fontSize="small" style={styles.dropdownIcon} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    height: '64px',
    background: 'linear-gradient(135deg, #7E57C2 0%, #8E24AA 100%)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    fontFamily: 'National2, -apple-system, BlinkMacSystemFont, "avenir next", avenir, "helvetica neue", helvetica, ubuntu, roboto, noto, "segoe ui", arial, sans-serif',
  },
  container: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    maxWidth: '100%',
  },
  left: {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
  },
  center: {
    flex: '1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  right: {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  menuButton: {
    background: 'none',
    border: 'none',
    color: '#FFFFFF',
    cursor: 'pointer',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'opacity 0.2s ease',
    opacity: 1,
  },
  logo: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    margin: 0,
    letterSpacing: '0.5px',
  },
  userMenu: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '8px',
    transition: 'opacity 0.2s ease',
    opacity: 1,
  },
  userIcon: {
    color: '#FFFFFF',
  },
  username: {
    color: '#FFFFFF',
    fontSize: '15px',
    fontWeight: '500',
  },
  chevronIcon: {
    color: '#FFFFFF',
    transition: 'transform 0.3s ease',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 8px)',
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    minWidth: '200px',
    overflow: 'hidden',
    zIndex: 1100,
    animation: 'fadeIn 0.2s ease',
  },
  dropdownButton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#424242',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'background-color 0.2s ease',
    fontFamily: 'inherit',
  },
  dropdownIcon: {
    color: '#7E57C2',
  },
  divider: {
    height: '1px',
    backgroundColor: '#E0E0E0',
    margin: '0',
  },
};

export default Navbar;