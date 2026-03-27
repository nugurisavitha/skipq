import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiMapPin,
  FiGrid,
  FiArrowRight,
  FiNavigation,
  FiLoader,
  FiX,
} from 'react-icons/fi';
import { foodCourtsAPI } from '../../services/api';
import { useGeolocation } from '../../hooks/useGeolocation';

const FoodCourtsPage = () => {
  const navigate = useNavigate();
  const { location, loading: geoLoading, getCurrentLocation, permissionStatus, checkPermission } = useGeolocation();

  const [foodCourts, setFoodCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Nearby food court detection
  const [nearbyFoodCourt, setNearbyFoodCourt] = useState(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyDismissed, setNearbyDismissed] = useState(false);
  const [autoDetectAttempted, setAutoDetectAttempted] = useState(false);

  // Check if we already have permission and auto-detect on mount
  useEffect(() => {
    const autoDetect = async () => {
      const status = await checkPermission();
      if (status === 'granted') {
        // Permission already granted — silently detect location
        detectNearbyFoodCourt();
      }
      setAutoDetectAttempted(true);
    };
    autoDetect();
  }, []);

  // Detect nearby food court using geolocation
  const detectNearbyFoodCourt = useCallback(async () => {
    setNearbyLoading(true);
    try {
      const loc = await getCurrentLocation();
      if (loc) {
        const response = await foodCourtsAPI.getNearby(loc.lat, loc.lng, 500);
        const nearby = response.data?.data?.foodCourts || [];
        if (nearby.length > 0) {
          setNearbyFoodCourt(nearby[0]); // closest one
          setNearbyDismissed(false);
        } else {
          setNearbyFoodCourt(null);
        }
      }
    } catch (err) {
      console.error('Nearby detection failed:', err);
    } finally {
      setNearbyLoading(false);
    }
  }, [getCurrentLocation]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch food courts
  useEffect(() => {
    const fetchFoodCourts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await foodCourtsAPI.getAll({
          search: debouncedSearch,
          page: currentPage,
        });

        const data = response.data?.data?.foodCourts || response.data?.data || [];
        setFoodCourts(Array.isArray(data) ? data : []);

        if (response.data?.data?.pagination) {
          setTotalPages(response.data.data.pagination.pages || 1);
        }
      } catch (err) {
        setError('Failed to load food courts. Please try again.');
        console.error('Error fetching food courts:', err);
        setFoodCourts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFoodCourts();
  }, [debouncedSearch, currentPage]);

  const handleExplore = (foodCourtId) => {
    navigate(`/food-courts/${foodCourtId}`);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showNearbyBanner = nearbyFoodCourt && !nearbyDismissed;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 font-poppins">
            Food Courts
          </h1>
          <p className="text-lg md:text-xl text-orange-100 font-poppins">
            Order from multiple restaurants at one food court with a single payment
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Nearby Food Court Detection Banner */}
        {showNearbyBanner && (
          <div className="mb-8 border-2 border-dashed border-green-300 rounded-[15px] overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 animate-slideInDown">
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FiNavigation className="text-white w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">
                        YOU ARE HERE
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 font-poppins">
                      {nearbyFoodCourt.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-poppins mt-0.5">
                      {nearbyFoodCourt.address}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-sm text-gray-700">
                      <FiGrid className="text-green-600" />
                      <span className="font-poppins">
                        {nearbyFoodCourt.restaurants?.length || 0} restaurants available
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setNearbyDismissed(true)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleExplore(nearbyFoodCourt._id || nearbyFoodCourt.id)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-[10px] font-semibold font-poppins flex items-center justify-center gap-2 transition-colors"
                >
                  <FiGrid className="w-5 h-5" />
                  Order from This Food Court
                </button>
                <button
                  onClick={() => setNearbyDismissed(true)}
                  className="px-4 py-3 border-2 border-gray-300 rounded-[10px] text-gray-600 font-semibold font-poppins hover:bg-gray-50 transition-colors"
                >
                  Browse All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location Detection Button (show only if no auto-detect and not already nearby) */}
        {autoDetectAttempted && !nearbyFoodCourt && !nearbyLoading && permissionStatus !== 'denied' && (
          <div className="mb-6 flex justify-center">
            <button
              onClick={detectNearbyFoodCourt}
              disabled={geoLoading || nearbyLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 border-2 border-blue-200 rounded-[15px] text-blue-700 font-semibold font-poppins hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              {geoLoading || nearbyLoading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  <span>Detecting your location...</span>
                </>
              ) : (
                <>
                  <FiNavigation className="w-4 h-4" />
                  <span>Are you at a food court? Tap to detect</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Detecting spinner */}
        {nearbyLoading && !showNearbyBanner && (
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2 px-5 py-2.5 text-gray-500 font-poppins">
              <FiLoader className="w-4 h-4 animate-spin" />
              <span>Checking if you're at a food court...</span>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <FiSearch className="absolute left-4 top-3 text-[#F2A93E] text-xl" />
            <input
              type="text"
              placeholder="Search food courts by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-orange-200 rounded-[15px] font-poppins focus:outline-none focus:border-[#F2A93E] transition-colors"
            />
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded">
            <p className="text-red-700 font-poppins">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="border-2 border-dashed border-orange-200 rounded-[15px] overflow-hidden animate-pulse"
              >
                <div className="bg-gray-200 h-48 w-full" />
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : foodCourts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍽️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 font-poppins">
              {searchTerm ? 'No food courts found' : 'No food courts available'}
            </h2>
            <p className="text-gray-600 font-poppins">
              {searchTerm
                ? 'Try adjusting your search criteria'
                : 'Check back soon for food court locations'}
            </p>
          </div>
        ) : (
          <>
            {/* Food Courts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {foodCourts.map((foodCourt) => {
                const isNearby = nearbyFoodCourt && (nearbyFoodCourt._id === foodCourt._id || nearbyFoodCourt._id === foodCourt.id);
                return (
                  <div
                    key={foodCourt._id || foodCourt.id}
                    className={`border-2 border-dashed rounded-[15px] overflow-hidden hover:shadow-lg transition-shadow duration-300 ${
                      isNearby ? 'border-green-400 ring-2 ring-green-200' : 'border-orange-200'
                    }`}
                  >
                    {/* Nearby badge on card */}
                    {isNearby && (
                      <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 text-center font-poppins">
                        <FiNavigation className="inline w-3 h-3 mr-1 -mt-0.5" />
                        YOU ARE HERE
                      </div>
                    )}

                    {/* Image Section */}
                    <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-[#F2A93E] to-[#F07054]">
                      {foodCourt.image ? (
                        <img
                          src={foodCourt.image}
                          alt={foodCourt.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-4xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4">
                      {/* Name */}
                      <h3 className="text-lg font-bold text-gray-800 mb-3 font-poppins line-clamp-2">
                        {foodCourt.name}
                      </h3>

                      {/* Address */}
                      <div className="flex items-start gap-2 mb-3 text-sm text-gray-600">
                        <FiMapPin className="text-[#F07054] flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2 font-poppins">
                          {foodCourt.address || 'Address not available'}
                        </span>
                      </div>

                      {/* Restaurant Count */}
                      <div className="flex items-center gap-2 mb-4 text-sm text-gray-700">
                        <FiGrid className="text-[#F2A93E]" />
                        <span className="font-poppins">
                          {foodCourt.restaurantCount || foodCourt.restaurants?.length || 0} Restaurants
                        </span>
                      </div>

                      {/* Explore Button */}
                      <button
                        onClick={() => handleExplore(foodCourt._id || foodCourt.id)}
                        className={`w-full py-2 rounded-[10px] font-semibold font-poppins flex items-center justify-center gap-2 hover:shadow-md transition-shadow duration-300 ${
                          isNearby
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white'
                        }`}
                      >
                        {isNearby ? 'Order Now' : 'Explore'}
                        <FiArrowRight />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mb-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border-2 border-orange-200 rounded-[10px] font-poppins font-semibold text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50 transition-colors"
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-4 py-2 rounded-[10px] font-poppins font-semibold transition-colors ${
                        currentPage === pageNum
                          ? 'bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white'
                          : 'border-2 border-orange-200 text-gray-800 hover:bg-orange-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border-2 border-orange-200 rounded-[10px] font-poppins font-semibold text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FoodCourtsPage;
