import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, KeyRound, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { useAuth } from '../../hooks/useAuth';
import { userApi } from '../../api/userApi';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const navigate = useNavigate();
  const { logout, userProfile } = useAuth();

  const handleLogout = async () => {
    try {
      // Call backend logout API to record logout time in login history
      await userApi.logout();
    } catch (error) {
      // Even if backend call fails, proceed with frontend logout
    } finally {
      // Clear authentication state from context and localStorage
      logout();
      // Navigate to login page
      navigate('/login', { replace: true });
    }
  };

  const handleResetPassword = () => {
    navigate('/change-password');
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 gradient-purple z-50 shadow-lg">
      <div className="flex items-center justify-between h-full px-4 relative">
        {/* Left - Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* Center - Logo */}
        <h1 className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-bold text-primary-foreground tracking-wide">
          SPENTOO
        </h1>

        {/* Right - User Name Box and Dropdown */}
        <div className="flex items-center gap-3 ml-auto">
          {/* User Name Box */}
          {(userProfile?.firstName || userProfile?.lastName) && (
            <div className="px-4 py-1.5 rounded-lg bg-primary-foreground/20 text-primary-foreground font-medium text-sm">
              {userProfile.firstName || ''} {userProfile.lastName || ''}
            </div>
          )}

          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={handleResetPassword}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Reset Password
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Navbar;