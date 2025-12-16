import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderOpen,
  TrendingDown,
  TrendingUp,
  Wallet,
  Repeat,
  PiggyBank,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const modules = [
  { name: 'Dashboard', icon: LayoutDashboard, route: '/dashboard' },
  { name: 'Categories', icon: FolderOpen, route: '/categories' },
  { name: 'Expenses', icon: TrendingDown, route: '/expenses' },
  { name: 'Income', icon: TrendingUp, route: '/income' },
  { name: 'Budget', icon: Wallet, route: '/budget' },
  { name: 'Recurring', icon: Repeat, route: '/recurring' },
  { name: 'Savings', icon: PiggyBank, route: '/savings' },
  { name: 'Loans', icon: CreditCard, route: '/loans' },
  { name: 'Bills', icon: Receipt, route: '/bills' },
];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (route: string) => {
    navigate(route);
    // Don't auto-close sidebar on navigation - let user control it via toggle button
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 z-40 lg:hidden"
          style={{ marginTop: '64px' }}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-64px)] bg-sidebar shadow-lg z-50 transition-transform duration-300 ease-in-out overflow-y-auto",
          isOpen ? "translate-x-0 w-56" : "-translate-x-full w-56 lg:translate-x-0 lg:w-0"
        )}
      >
        <nav className="flex flex-col py-2">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = location.pathname === module.route;

            return (
              <button
                key={module.name}
                onClick={() => handleNavigate(module.route)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 mx-2 my-1 rounded-md text-sm font-medium transition-all duration-300",
                  isActive
                    ? "gradient-purple text-primary-foreground"
                    : "text-sidebar-foreground hover:gradient-purple hover:text-primary-foreground"
                )}
              >
                <Icon className="h-5 w-5 min-w-[20px]" />
                <span className="whitespace-nowrap">{module.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;