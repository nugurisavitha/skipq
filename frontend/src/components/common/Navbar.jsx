import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FiShoppingCart,
  FiUser,
  FiMenu,
  FiX,
  FiLogOut,
  FiHome,
  FiList,
  FiSearch,
  FiMapPin,
  FiGrid,
  FiBell,
  FiCheck,
  FiTrash2,
  FiPackage,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { useNotifications } from '../../hooks/useNotifications';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { getItemCount } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const getNotifIcon = (type) => {
    switch (type) {
      case 'order_ready': return '🔔';
      case 'order_update': return '📦';
      case 'order_placed': return '✅';
      case 'promo': return '🎉';
      default: return '💬';
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const getRolePath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'customer':
        return '/';
      case 'restaurant_admin':
        return '/restaurant-admin/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'super_admin':
        return '/admin/dashboard';
      case 'delivery_admin':
        return '/delivery/dashboard';
      default:
        return '/';
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - always links to homepage */}
          <Link
            to="/"
            className="flex items-center space-x-2 flex-shrink-0"
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:inline">
              SkipQ
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {(!isAuthenticated || user?.role === 'customer') && (
              <>
                <Link
                  to="/"
                  className={`flex items-center space-x-1 ${
                    isActive('/') ? 'text-primary' : 'text-gray-700'
                  } hover:text-primary transition-colors`}
                >
                  <FiHome className="w-5 h-5" />
                  <span>Home</span>
                </Link>
                <Link
                  to="/food-courts"
                  className={`flex items-center space-x-1 ${
                    location.pathname.startsWith('/food-court') ? 'text-primary' : 'text-gray-700'
                  } hover:text-primary transition-colors font-semibold`}
                >
                  <FiGrid className="w-5 h-5" />
                  <span>Food Courts</span>
                </Link>
                <Link
                  to="/restaurants"
                  className={`flex items-center space-x-1 ${
                    isActive('/restaurants') ? 'text-primary' : 'text-gray-700'
                  } hover:text-primary transition-colors`}
                >
                  <FiList className="w-5 h-5" />
                  <span>Restaurants</span>
                </Link>
              </>
            )}
          </div>

          {/* Right side icons */}
          <div className="hidden md:flex items-center space-x-4">
            {(!isAuthenticated || user?.role === 'customer') && (
              <Link
                to="/cart"
                className="relative p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiShoppingCart className="w-6 h-6" />
                {getItemCount() > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-primary rounded-full">
                    {getItemCount()}
                  </span>
                )}
              </Link>
            )}

            {/* Notification Bell */}
            {isAuthenticated && (
              <div className="relative">
                <button
                  onClick={() => { setIsNotifOpen(!isNotifOpen); setIsUserMenuOpen(false); }}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors relative"
                >
                  <FiBell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[18px]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-[15px] shadow-xl border-2 border-dashed border-orange-200 overflow-hidden z-50">
                    <div className="p-4 border-b border-orange-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-white">
                      <h3 className="font-bold text-gray-900">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-primary font-medium hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button
                            onClick={clearAll}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                            title="Clear all"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <FiBell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No notifications yet</p>
                        </div>
                      ) : (
                        notifications.slice(0, 15).map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => {
                              markAsRead(notif.id);
                              if (notif.link) {
                                navigate(notif.link);
                                setIsNotifOpen(false);
                              } else if (notif.orderId) {
                                navigate(`/orders/${notif.orderId}`);
                                setIsNotifOpen(false);
                              }
                            }}
                            className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-orange-50/50 transition-colors ${
                              !notif.read ? 'bg-orange-50/80' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-lg flex-shrink-0 mt-0.5">{getNotifIcon(notif.type)}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm ${!notif.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                </p>
                              </div>
                              {!notif.read && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-2 border-t border-orange-100 bg-gray-50">
                        <button
                          onClick={() => { setIsNotifOpen(false); navigate('/orders'); }}
                          className="w-full text-center text-xs text-primary font-semibold py-1.5 hover:underline"
                        >
                          View All Orders
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => { setIsUserMenuOpen(!isUserMenuOpen); setIsNotifOpen(false); }}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiUser className="w-6 h-6" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 animate-slideInRight">
                    <div className="p-4 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.name}
                      </p>
                      <p className="text-xs text-gray-600">{user?.email}</p>
                    </div>

                    <div className="py-2">
                      {user?.role === 'customer' && (
                        <>
                          <Link
                            to="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Profile
                          </Link>
                          <Link
                            to="/orders"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            My Orders
                          </Link>
                        </>
                      )}

                      {user?.role === 'restaurant_admin' && (
                        <>
                          <Link
                            to="/restaurant-admin/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Dashboard
                          </Link>
                          <Link
                            to="/restaurant-admin/settings"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Settings
                          </Link>
                        </>
                      )}

                      {['admin', 'super_admin'].includes(user?.role) && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Admin Panel
                        </Link>
                      )}

                      {user?.role === 'delivery_admin' && (
                        <Link
                          to="/delivery/dashboard"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Dashboard
                        </Link>
                      )}
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-error hover:bg-error/10 border-t border-gray-200 transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-primary font-medium hover:bg-primary/10 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? (
              <FiX className="w-6 h-6" />
            ) : (
              <FiMenu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200 animate-slideInDown">
            {(!isAuthenticated || user?.role === 'customer') && (
              <>
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/food-courts"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-primary font-semibold hover:bg-primary/10 transition-colors"
                >
                  <FiGrid className="w-4 h-4" />
                  <span>Food Courts</span>
                </Link>
                <Link
                  to="/restaurants"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Restaurants
                </Link>
                <Link
                  to="/cart"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  <FiShoppingCart />
                  <span>Cart ({getItemCount()})</span>
                </Link>
              </>
            )}

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-error hover:bg-error/10 transition-colors"
                >
                  <FiLogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-2 text-primary font-medium hover:bg-primary/10 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
