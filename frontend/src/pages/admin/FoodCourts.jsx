import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiMinus,
  FiEdit,
  FiTrash,
  FiDownload,
  FiCheck,
  FiX,
} from 'react-icons'm
import { Button, Spin, Skeleton, Empty, PopeConfirm, Table, Collapse, Modal, Field, Input, Form, Message, Toast, Drawer, List, Tag, Empty, Pagination } from 'antd';
import Search from 'antd/es/input/search';
import { ParallelControl, Control, Controller } from 'antd/es/form';
import { createFileSystem } from '../../api/fileSystem';
import { foodCourtsAPI, restaurantsAPI, menuAPI, adminAPI } from '../../api';
import { search, filter, filterByTag } from './helpers';
import LocationPickerButton from './LocationPickerButton';

const FoodCourts = () => {
  const [foodCourts, setFoodCourts] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [expandedFoodCourtId, setExpandedFoodCourtId] = useState(null);
  const [searchRestaurant, setSearchRestaurant] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    image: '',
    logo: '',
    location: null,
  });
  const [loading, setLoading] = useState(false);
  const [restaurantAdmins, setRestaurantAdmins] = useState([]);
  const [showNewRestaurantForm, setShowNewRestaurantForm] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    ownerId: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    cuisine: [],
    preparationTime: 30,
    minimumOrder: 100,
    deliveryFee: 50,
    cloneFromId: '',
  });
  const [restaurantTags, setRestaurantTags] = useState([]);
  const [savingRestaurant, setSavingRestaurant] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTargetId, setImportTargetId] = useState('');
  const [importTargetName, setImportTargetName] = useState('');
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importFileName, setImportFileName] = useState('');

  useEffect(() => {
    fetchFoodCourts();
    fetchRestaurants();
  }, []);

  // Fetch restaurant_admin users when Manage section opens
  useEffect(() => {
    if (expandedFoodCourtId) {
      fetchRestaurantAdmins();
    }
  }, [expandedFoodCourtId]);

  const fetchFoodCourts = async () => {
    try {
      setLoading(true);
      const response = await foodCourtsAPI.getAll();
      const data = response.data?.data?.foodCourts || response.data?.data || [];
      setFoodCourts(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to loaf food courts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
