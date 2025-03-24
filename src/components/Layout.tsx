import React, { useState, ReactNode, useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { FiMenu, FiLogOut } from 'react-icons/fi';
import { 
  FiHome, 
  FiFolder, 
  FiPlay, 
  FiUsers, 
  FiShield 
} from 'react-icons/fi';
import { BiTestTube } from 'react-icons/bi';
import { Button } from '@/components/ui/button';
import { usePocketBase } from '@/contexts/PocketBaseContext';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated, logout } = usePocketBase();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login' });
    }
  }, [isAuthenticated, navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <FiHome className="h-5 w-5" />, path: '/' },
    { text: 'Resources', icon: <FiFolder className="h-5 w-5" />, path: '/resources' },
    { text: 'Actions', icon: <FiPlay className="h-5 w-5" />, path: '/actions' },
    { text: 'Roles', icon: <FiUsers className="h-5 w-5" />, path: '/roles' },
    { text: 'Permissions', icon: <FiShield className="h-5 w-5" />, path: '/permissions' },
    { text: 'Test Permissions', icon: <BiTestTube className="h-5 w-5" />, path: '/test' },
  ];

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  // If not authenticated, don't render the layout
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={handleDrawerToggle}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <h2 className="text-xl font-semibold">ABAC Manager</h2>
          </div>
          
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {menuItems.map((item) => (
                <li key={item.text}>
                  <Link
                    to={item.path}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-secondary text-foreground"
                    activeProps={{
                      className: "bg-primary text-primary-foreground hover:bg-primary"
                    }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.icon}
                    <span>{item.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-border">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleLogout}
            >
              <FiLogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <button
            onClick={handleDrawerToggle}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium md:hidden"
          >
            <FiMenu className="h-6 w-6" />
            <span className="sr-only">Toggle Menu</span>
          </button>
          
          <h1 className="text-lg font-semibold">ABAC Permission Management</h1>
          
          <div className="ml-auto flex items-center gap-2">
            {!isAuthenticated && (
              <Button 
                variant="outline" 
                onClick={() => navigate({ to: '/login' })}
              >
                Login
              </Button>
            )}
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
