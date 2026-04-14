import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  FiMenu,
  FiX,
  FiHome,
  FiShoppingCart,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiCoffee,
  FiMaximize,
  FiGrid,
  FiTruck,
  FiClock,
} from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getSidebarItems = () => {
    const role = user?.role;
    const baseItems = [];

    if (role === 'restaurant_admin') {
      baseItems.push(
        { label: 'Dashboard', path: '/restaurant-admin/dashboard', icon: FiHome },
        { label: 'Orders', path: '/restaurant-admin/orders', icon: FiShoppingCart },
        { label: 'Menu', path: '/restaurant-admin/menu', icon: FiCoffee },
        { label: 'QR Codes', path: '/restaurant-admin/qr-codes', icon: FiMaximize },
        { label: 'Tables', path: '/restaurant-admin/tables', icon: FiGrid },
        { label: 'Settings', path: '/restaurant-admin/settings', icon: FiSettings }
      );
    } else if (role === 'admin' || role === 'super_admin') {
      baseItems.push(
        { label: 'Dashboard', path: '/admin/dashboard', icon: FiHome },
        { label: 'Food Courts', path: '/admin/food-courts', icon: FiGrid },
        { label: 'Restaurants', path: '/admin/restaurants', icon: FiCoffee },
        { label: 'Orders', path: '/admin/orders', icon: FiShoppingCart },
        { label: 'Users', path: '/admin/users', icon: FiUsers },
        { label: 'Delivery Agents', path: '/admin/pending-agents', icon: FiTruck },
        { label: 'Analytics', path: '/admin/analytics', icon: FiBarChart2 },
        { label: 'Settings', path: '/admin/settings', icon: FiSettings }
      );
    } else if (role === 'delivery_admin') {
      baseItems.push(
        { label: 'Dashboard', path: '/delivery/dashboard', icon: FiHome },
        { label: 'Orders', path: '/delivery/orders', icon: FiShoppingCart },
        { label: 'History', path: '/delivery/history', icon: FiClock }
      );
    }

    return baseItems;
  };

  const sidebarItems = getSidebarItems();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-body-bg">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg transition-transform duration-300 z-40 md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ boxShadow: '0 0 20px rgba(89,102,122,0.1)' }}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              SkipQ
            </h1>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all relative ${
                    active
                      ? 'text-primary'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"></div>
                  )}
                  <Icon size={18} className="flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary-dark flex items-center justify-center text-white font-semibold text-sm">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate text-sm">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">
                  {user?.role || 'Role'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm transition-all"
            >
              <FiLogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Toggle */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-border flex items-center px-4 z-30 md:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
        <h1 className="ml-4 text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
          SkipQ
        </h1>
      </div>

      {/* Main Content */}
      <main
        className={`flex-1 md:ml-64 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        }`}
      >
        <div className="md:hidden h-16"></div>
        <div className="p-6 md:p-8">{children}</div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}
