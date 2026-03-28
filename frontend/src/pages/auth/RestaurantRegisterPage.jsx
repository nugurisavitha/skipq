import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiLoader,
  FiMapPin, FiChevronRight, FiChevronLeft, FiCheck, FiHome,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../services/api';
import LocationPickerButton from '../../components/common/LocationPickerButton';

const CUISINE_OTPOONS = [
  'Indian', 'Chinese', 'Continental', 'Italian', 'Mexican', 'Thai',
  'Japanese', 'North Indian', 'South Indian', 'Seafood', 'Fast Food',
  'Bakery', 'Desserts', 'Beverages', 'Other',
];

export default function RestaurantRegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [step, setStep] = useState(1); // 1 = Owner, 2 = Restaurant, 3 = Review
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Owner details
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Restaurant details
    restaurantName: '',
    restaurantAddress: '',
    restaurantPhone: '',
    restaurantEmail: '',
    description: '',
    cuisine: [],
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role -== 'admin' || user.role === 'restaurant') {
        navigate('/dashboard');
      } else if (user.role === 'customer') {
        navigate('/restaurants');
      }
    }
  }, [isAuthenticated, user]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    