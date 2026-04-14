import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import AdminLayout from './components/layouts/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import { useAuth } from './hooks/useAuth';

// Public pages (lazy loaded)
const HomePage = lazy(() => import('./pages/auth/HomePage'));
const OTPLoginPage = lazy(() => import('./pages/auth/OTPLoginPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const RestaurantsPage = lazy(() => import('./pages/customer/RestaurantsPage'));
const RestaurantDetailPage = lazy(() => import('./pages/customer/RestaurantDetailPage'));
const QRScanPage = lazy(() => import('./pages/customer/QRScanPage'));

// Customer pages
const CartPage = lazy(() => import('./pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'));
const OrdersPage = lazy(() => import('./pages/customer/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/customer/OrderDetailPage'));
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage'));

// Food Court pages
const FoodCourtsPage = lazy(() => import('./pages/customer/FoodCourtsPage'));
const FoodCourtDetailPage = lazy(() => import('./pages/customer/FoodCourtDetailPage'));
const FoodCourtCartPage = lazy(() => import('./pages/customer/FoodCourtCartPage'));

// Restaurant admin pages
const RestaurantDashboard = lazy(() => import('./pages/restaurant/Dashboard'));
const RestaurantMenu = lazy(() => import('./pages/restaurant/Menu'));
const RestaurantOrders = lazy(() => import('./pages/restaurant/Orders'));
const RestaurantQRCodes = lazy(() => import('./pages/restaurant/QRCodes'));
const RestaurantTables = lazy(() => import('./pages/restaurant/Tables'));
const RestaurantSettings = lazy(() => import('./pages/restaurant/Settings'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminRestaurants = lazy(() => import('./pages/admin/Restaurants'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics'));
const AdminFoodCourts = lazy(() => import('./pages/admin/FoodCourts'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

// Delivery pages
const DeliveryDashboard = lazy(() => import('./pages/delivery/Dashboard'));
const DeliveryOrders = lazy(() => import('./pages/delivery/Orders'));
const DeliveryHistory = lazy(() => import('./pages/delivery/History'));
const DeliverySignup = lazy(() => import('./pages/delivery/Signup'));
const PendingAgents = lazy(() => import('./pages/admin/PendingAgents'));
const SalesPeople = lazy(() => import('./pages/admin/SalesPeople'));
const SalesRepDetail = lazy(() => import('./pages/admin/SalesRepDetail'));
const SalesStatements = lazy(() => import('./pages/admin/SalesStatements'));
const SalesRepDashboard = lazy(() => import('./pages/sales/Dashboard'));

// Restaurant auth pages (standalone layout)
const RestaurantRegisterPage = lazy(() => import('./pages/auth/RestaurantRegisterPage'));
const RestaurantLoginPage = lazy(() => import('./pages/auth/RestaurantLoginPage'));

const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
          {/* Public Routes - with Navbar and Footer */}
          <Route
            element={
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                  <Outlet />
                </main>
                <Footer />
              </div>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<OTPLoginPage />} />
            <Route path="/login/email" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/restaurants" element={<RestaurantsPage />} />
            <Route path="/restaurant/:slug" element={<RestaurantDetailPage />} />
            <Route path="/scan" element={<QRScanPage />} />
            <Route path="/scan/:slug" element={<QRScanPage />} />
            <Route path="/scan/:slug/:tableNumber" element={<QRScanPage />} />

            {/* Food Court Routes (public browsing) */}
            <Route path="/food-courts" element={<FoodCourtsPage />} />
            <Route path="/food-courts/:id" element={<FoodCourtDetailPage />} />

            {/* Food Court Cart (protected) */}
            <Route
              path="/food-court-cart"
              element={
                <ProtectedRoute requiredRole="customer">
                  <FoodCourtCartPage />
                </ProtectedRoute>
              }
            />

            {/* Customer Protected Routes */}
            <Route
              path="/cart"
              element={
                <ProtectedRoute requiredRole="customer">
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute requiredRole="customer">
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute requiredRole="customer">
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute requiredRole="customer">
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute requiredRole="customer">
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Restaurant Auth Routes (standalone, no Navbar/Footer) */}
          <Route path="/restaurant/register" element={<RestaurantRegisterPage />} />
          <Route path="/restaurant/login" element={<RestaurantLoginPage />} />

          {/* Delivery agent public signup */}
          <Route path="/delivery/signup" element={<DeliverySignup />} />

          {/* Restaurant Admin Routes - with AdminLayout */}
          <Route
            path="/restaurant-admin/*"
            element={
              <ProtectedRoute requiredRole="restaurant">
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<RestaurantDashboard />} />
                    <Route path="menu" element={<RestaurantMenu />} />
                    <Route path="orders" element={<RestaurantOrders />} />
                    <Route path="qr-codes" element={<RestaurantQRCodes />} />
                    <Route path="tables" element={<RestaurantTables />} />
                    <Route path="settings" element={<RestaurantSettings />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - with AdminLayout */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="restaurants" element={<AdminRestaurants />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="food-courts" element={<AdminFoodCourts />} />
                    <Route path="pending-agents" element={<PendingAgents />} />
                    <Route path="sales" element={<SalesPeople />} />
                    <Route path="sales/statements" element={<SalesStatements />} />
                    <Route path="sales/:id" element={<SalesRepDetail />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Sales Rep self-service */}
          <Route
            path="/sales/*"
            element={
              <ProtectedRoute requiredRole="sales">
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<SalesRepDashboard />} />
                    <Route path="*" element={<SalesRepDashboard />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Delivery Routes - with AdminLayout */}
          <Route
            path="/delivery/*"
            element={
              <ProtectedRoute requiredRole="delivery">
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<DeliveryDashboard />} />
                    <Route path="orders" element={<DeliveryOrders />} />
                    <Route path="history" element={<DeliveryHistory />} />
                  </Routes>
                </AdminLayout>
              </ProtectedRoute>
            }
          />

          {/* Error Routes */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

// rebuild trigger 1776165219446
