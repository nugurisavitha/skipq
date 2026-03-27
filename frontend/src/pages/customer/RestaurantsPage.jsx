import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiMapPin,
  FiSearch,
  FiStar,
  FiFilter,
  FiChevronDown,
  FiClock,
  FiTrendingUp,
  FiDollarSign,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const CUISINE_OPTIONS = [
  { name: 'Italian', icon: '🍝' },
  { name: 'Chinese', icon: '🥡' },
  { name: 'Indian', icon: '🍛' },
  { name: 'Mexican', icon: '🌮' },
  { name: 'Thai', icon: '🍜' },
  { name: 'Japanese', icon: '🍱' },
  { name: 'American', icon: '🍔' },
  { name: 'Mediterranean', icon: '🥙' },
  { name: 'Fast Food', icon: '⚡' },
  { name: 'Desserts', icon: '🍰' }
];

const SORT_OPTIONS = [
  { value: 'rating', label: 'Top Rated', icon: FiStar },
  { value: 'delivery_time', label: 'Fastest Delivery', icon: FiClock },
  { value: 'min_order', label: 'Lowest Min Order', icon: FiDollarSign },
  { value: 'trending', label: 'Trending', icon: FiTrendingUp },
];

export default function RestaurantsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [sortBy, setSortBy] = useState('rating');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = {
          search: searchQuery,
          cuisines: selectedCuisines.join(','),
          sort: sortBy,
        };
        const response = await api.restaurants.getAll(params);
        const data = response.data?.data;
        setRestaurants(data?.restaurants || data || []);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to fetch restaurants';
        setError(message);
        toast.error(message);
        setRestaurants([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchRestaurants, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCuisines, sortBy]);

  const toggleCuisine = (cuisineName) => {
    setSelectedCuisines((prev) =>
      prev.includes(cuisineName)
        ? prev.filter((c) => c !== cuisineName)
        : [...prev, cuisineName]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCuisines([]);
    setSortBy('rating');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-dark relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full -ml-36 -mb-36"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
              Order from your favorites
            </h1>
            <p className="text-white/80 text-lg flex items-center space-x-2">
              <FiMapPin className="w-5 h-5" />
              <span>Delivering to your location</span>
            </p>
          </div>

          {/* Search Bar Overlay */}
          <div className="relative max-w-2xl">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <input
              type="text"
              placeholder="Search restaurants, cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-12 w-full h-12 rounded-lg shadow-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Filters and Cuisine Pills */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Cuisine Filter - Horizontal Scrollable */}
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-3">
              <FiFilter className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-900 text-sm">Cuisines</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CUISINE_OPTIONS.map(({ name, icon }) => (
                <button
                  key={name}
                  onClick={() => toggleCuisine(name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center space-x-1 border-1 ${
                    selectedCuisines.includes(name)
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white border-primary shadow-md'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sort and Clear */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="btn btn-outline flex items-center space-x-2 text-sm border-1 border-gray-200 hover:border-primary hover:bg-primary/5 transition-all rounded-lg"
              >
                <span>Sort by</span>
                <FiChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
              </button>
              {showSortMenu && (
                <div className="absolute top-full mt-2 left-0 bg-white border-1 border-gray-200 rounded-lg shadow-lg z-10 min-w-max">
                  {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => {
                        setSortBy(value);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-3 flex items-center space-x-2 hover:bg-primary/5 border-b border-gray-100 last:border-0 transition-colors ${
                        sortBy === value ? 'bg-primary/10 text-primary font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {(searchQuery || selectedCuisines.length > 0) && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <EmptyState
            icon={FiSearch}
            title="Error loading restaurants"
            description={error}
            actionLabel="Try Again"
            onAction={() => window.location.reload()}
          />
        ) : restaurants.length === 0 ? (
          <EmptyState
            icon={FiSearch}
            title="No restaurants found"
            description="Try adjusting your search, cuisine filters, or location"
            actionLabel="Clear Filters"
            onAction={clearFilters}
          />
        ) : (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Popular near you</h2>
              <p className="text-sm text-gray-600">
                Showing {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {restaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  to={`/restaurant/${restaurant.slug}`}
                  className="group rounded-[15px] overflow-hidden border-1 border-dashed border-gray-200 hover:border-primary hover:shadow-lg transition-all duration-300 bg-white"
                >
                  {/* Image Container */}
                  <div className="relative w-full h-48 bg-gray-300 overflow-hidden">
                    <img
                      src={restaurant.image || 'https://via.placeholder.com/300x200?text=Restaurant'}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />

                    {/* Rating Badge Overlay */}
                    <div className="absolute top-3 left-3 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center space-x-1">
                      <FiStar className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{restaurant.rating || 4.5}</span>
                    </div>

                    {/* Discount Badge */}
                    {restaurant.discount && (
                      <div className="absolute top-3 right-3 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold">
                        {restaurant.discount}% OFF
                      </div>
                    )}

                    {/* Self-Service Badge */}
                    {restaurant.selfService && !restaurant.discount && (
                      <div className="absolute top-3 right-3 bg-blue-600/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold">
                        Self-Service
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {restaurant.name}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-1">
                        {restaurant.cuisines?.join(', ')}
                      </p>
                    </div>

                    {/* Delivery Info */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center space-x-1">
                        <FiClock className="w-4 h-4" />
                        <span>{restaurant.deliveryTime || 30} mins</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
