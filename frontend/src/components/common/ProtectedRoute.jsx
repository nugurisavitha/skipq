import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Map frontend route roles to backend role names
  const roleMap = {
    customer: 'customer',
    restaurant: 'restaurant_admin',
    admin: ['admin', 'super_admin'],
    delivery: 'delivery_admin',
    sales: ['sales_rep', 'sales_manager', 'finance'],
  };

  const allowedRoles = roleMap[requiredRole] || requiredRole;
  const hasRole = Array.isArray(allowedRoles)
    ? allowedRoles.includes(user?.role)
    : user?.role === allowedRoles;

  if (requiredRole && !hasRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
