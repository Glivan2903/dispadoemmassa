import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Settings,
  LogOut,
  Menu,
  X,
  Send,
  BarChart2
} from 'lucide-react';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/campanha', icon: Send, label: 'Campanha' },
  { path: '/evolution', icon: BarChart2, label: 'Evolution' },
];

const bottomMenuItems = [
  { path: '/config', icon: Settings, label: 'Configurações' },
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-petshop-blue text-white"
        onClick={toggleMobileMenu}
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-petshop-blue text-white transition-all duration-300 z-40',
          isCollapsed ? 'w-16' : 'w-64',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between">
            {!isCollapsed && <h1 className="text-xl font-bold">Administrador</h1>}
            <button
              onClick={toggleSidebar}
              className="hidden md:block p-2 rounded-md hover:bg-white/10"
            >
              {isCollapsed ? (
                <Menu className="h-6 w-6" />
              ) : (
                <X className="h-6 w-6" />
              )}
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-2 p-4">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center gap-4 p-2 rounded-md hover:bg-white/10 transition-colors',
                      location.pathname === item.path && 'bg-white/20'
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-white/10">
            <ul className="space-y-2">
              {bottomMenuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      'flex items-center gap-4 p-2 rounded-md hover:bg-white/10 transition-colors',
                      location.pathname === item.path && 'bg-white/20'
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  onClick={signOut}
                  className="flex items-center gap-4 p-2 rounded-md hover:bg-white/10 transition-colors w-full"
                >
                  <LogOut className="h-6 w-6" />
                  {!isCollapsed && <span>Sair</span>}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
}; 