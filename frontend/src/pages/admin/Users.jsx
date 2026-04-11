import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiEdit2, FiTrash2, FiChevronDown, FiChevronLeft, FiChevronRight, FiLoader, FiAlertCircle, FiCheckCircle, FiXCircle, FiPlus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function AdminUsers() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('');
  const [roleCounts, setRoleCounts] = useState({});

  const usersPerPage = 10;
  const ROLE_OPTIONS = ['customer', 'restaurant_admin', 'delivery_admin', 'admin', 'super_admin'];
  const ROLE_COLORS = {
    customer: 'blue',
    restaurant_admin: 'orange',
    delivery_admin: 'purple',
    admin: 'green',
    super_admin: 'red',
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({});
      setUsers(response.data?.data?.users || response.data?.users || []);
      setRoleCounts(response.data?.data?.roleCounts || response.data?.roleCounts || {});
      toast.success('Users loaded successfully');
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) {
      toast.error('Please select a role');
      return;
    }

    try {
      await adminAPI.updateRole(selectedUser._id || selectedUser.id, newRole);
      toast.success('User role updated successfully');
      setShowRoleModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.response?.data?.message || 'Failed to update user role');
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      customer: 'bg-blue-100 text-blue-800',
      restaurant_admin: 'bg-orange-100 text-orange-800',
      delivery_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-green-100 text-green-800',
      super_admin: 'bg-red-100 text-red-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };