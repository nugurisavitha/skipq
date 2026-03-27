import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiSearch,
  FiMapPin,
  FiClock,
  FiStar,
  FiArrowRight,
  FiSmartphone,
  FiShoppingBag,
  FiTruck,
  FiCheckCircle,
  FiGrid,
} from 'react-icons/fi';
import { restaurantsAPI, foodCourtsAPI } from '../../services/api';

// Skeleton Loader Component
function RestaurantCardSkeleton() {
  return (
    <div className="bg-white rounded-[15px] overflow-hidden shadow-md animate-pulse">
      <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
        <div className="h-3 bg-gray-100 rounded mb-3 w-full" />
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-100 rounded w-1/4" />
          <div className="h-3 bg-gray-100 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

// Restaurant Card Component
function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/restaurants/${restaurant._id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-[15px] overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
    >
      {/* Image Container */}
      <div className="relative w-full h-48 bg-gradient-to-br from-[#F2A93E] to-[#F07054] overflow-hidden flex items-center justify-center">
        <div className="text-white/20">
          <FiShoppingBag className="w-24 h-24" />
        </div>
        {restaurant.isNew && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            New
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
          {restaurant.name}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-1">
          {restaurant.cuisines?.join(', ') || 'Multi-cuisine'}
        </p>

        {/* Rating and Details */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            <FiStar className="w-4 h-4 text-[#F2A93E] fill-current" />
            <span className="text-sm font-semibold text-gray-900">
              {restaurant.rating || 4.5}
            </span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <FiClock className="w-4 h-4" />
            <span>{restaurant.deliveryTime || 30} min</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// Horizontal Restaurant Card (for Trending)
function HorizontalRestaurantCard({ restaurant }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/restaurants/${restaurant._id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white rounded-[15px] overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex"
    >
      {/* Left Image */}
      <div className="w-32 h-32 bg-gradient-to-br from-[#F2A93E] to-[#F07054] flex-shrink-0 flex items-center justify-center">
        <FiShoppingBag className="w-16 h-16 text-white/20" />
      </div>

      {/* Right Content */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 mb-1">
            {restaurant.name}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-1 mb-2">
            {restaurant.cuisines?.join(', ') || 'Multi-cuisine'}
          </p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <FiStar className="w-4 h-4 text-[#F2A93E] fill-current" />
            <span className="font-semibold text-gray-900">
              {restaurant.rating || 4.5}
            </span>
          </div>
          <span className="text-gray-600 flex items-center space-x-1">
            <FiClock className="w-4 h-4" />
            <span>{restaurant.deliveryTime || 30} min</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [trendingRestaurants, setTrendingRestaurants] = useState([]);
  const [foodCourts, setFoodCourts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [restRes, fcRes] = await Promise.all([
          restaurantsAPI.getAll({ limit: 8 }),
          foodCourtsAPI.getAll({ limit: 4 }).catch(() => ({ data: { data: { foodCourts: [] } } })),
        ]);

        const allRestaurants = restRes.data?.data || restRes.data || [];
        setRestaurants(allRestaurants.slice(0, 8));

        const sorted = [...allRestaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setTrendingRestaurants(sorted.slice(0, 6));

        const fcData = fcRes.data?.data?.foodCourts || fcRes.data?.data || [];
        setFoodCourts(Array.isArray(fcData) ? fcData : []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setRestaurants([]);
        setTrendingRestaurants([]);
        setFoodCourts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/restaurants?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const categories = [
    { name: 'Pizza', emoji: '🍕', cuisine: 'pizza' },
    { name: 'Burger', emoji: '🍔', cuisine: 'burger' },
    { name: 'Biryani', emoji: '🍛', cuisine: 'biryani' },
    { name: 'Chinese', emoji: '🥡', cuisine: 'chinese' },
    { name: 'Desserts', emoji: '🍰', cuisine: 'desserts' },
    { name: 'Beverages', emoji: '🥤', cuisine: 'beverages' },
    { name: 'Healthy', emoji: '🥗', cuisine: 'healthy' },
    { name: 'South Indian', emoji: '🍲', cuisine: 'south-indian' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#F2A93E] via-[#F08C4D] to-[#F07054] text-white py-20 px-4 md:py-32">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/5 rounded-full -ml-40 -mb-40 blur-3xl" />
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1000 500">
            <circle cx="100" cy="100" r="80" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
            <circle cx="800" cy="400" r="120" fill="none" stroke="white" strokeWidth="2" opacity="0.2" />
            <path d="M 200 300 Q 400 200 600 300" stroke="white" strokeWidth="2" fill="none" opacity="0.2" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 animate-fadeIn">
                Discover the Best Food & Drinks
              </h1>
              <p className="text-lg text-white/90 mb-8 leading-relaxed">
                Order from thousands of restaurants and get your favorite meals delivered hot and fresh to your doorstep.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="mb-8">
                <div className="flex items-center bg-white rounded-full shadow-lg overflow-hidden focus-within:ring-4 focus-within:ring-yellow-300 transition-all">
                  <FiSearch className="w-6 h-6 text-gray-400 ml-6" />
                  <input
                    type="text"
                    placeholder="Search for restaurants, cuisines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none text-base"
                  />
                  <button
                    type="submit"
                    className="bg-[#F2A93E] hover:bg-[#F07054] text-white font-bold px-8 py-4 transition-colors"
                  >
                    Search
                  </button>
                </div>
              </form>

              {/* CTA Button */}
              <Link
                to="/restaurants"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-[#F07054] font-bold rounded-full hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span>Order Now</span>
                <FiArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Right Illustration */}
            <div className="hidden md:flex items-center justify-center z-10">
              <div className="relative w-80 h-80">
                {/* Floating food illustrations */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/30 rounded-3xl flex items-center justify-center shadow-lg transform rotate-12 hover:rotate-0 transition-transform">
                  <span className="text-6xl">🍕</span>
                </div>
                <div className="absolute bottom-12 left-0 w-28 h-28 bg-orange-200/30 rounded-3xl flex items-center justify-center shadow-lg transform -rotate-12 hover:rotate-0 transition-transform">
                  <span className="text-5xl">🍔</span>
                </div>
                <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-white/20 rounded-full flex items-center justify-center shadow-lg transform -translate-x-1/2 -translate-y-1/2">
                  <span className="text-7xl">🍜</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOD COURTS — PRIMARY FEATURE ==================== */}
      <section className="py-16 md:py-24 px-4 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F2A93E]/5 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-12">
            <div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#F2A93E]/10 to-[#F07054]/10 rounded-full mb-4">
                <FiGrid className="w-4 h-4 text-[#F07054]" />
                <span className="text-sm font-bold text-[#F07054]">NEW FEATURE</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Food Courts
              </h2>
              <p className="text-gray-600 text-lg">
                Order from multiple restaurants, pay once — the ultimate dine-in experience
              </p>
            </div>
            <Link
              to="/food-courts"
              className="hidden sm:flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white font-bold rounded-full hover:shadow-lg transition-all transform hover:scale-105"
            >
              <span>Explore All</span>
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-[15px] overflow-hidden shadow-md animate-pulse">
                  <div className="w-full h-40 bg-gradient-to-br from-gray-200 to-gray-300" />
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : foodCourts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {foodCourts.map((fc) => (
                <Link
                  key={fc._id || fc.id}
                  to={`/food-courts/${fc._id || fc.id}`}
                  className="group bg-white border-2 border-dashed border-orange-200 rounded-[15px] overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:border-[#F07054]"
                >
                  <div className="relative w-full h-40 bg-gradient-to-br from-[#F2A93E] to-[#F07054] flex items-center justify-center overflow-hidden">
                    {fc.image ? (
                      <img src={fc.image} alt={fc.name} className="w-full h-full object-cover" />
                    ) : (
                      <FiGrid className="w-16 h-16 text-white/30" />
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 text-[#F07054] text-xs font-bold px-3 py-1 rounded-full">
                      {fc.restaurants?.length || 0} Restaurants
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#F07054] transition-colors">
                      {fc.name}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center space-x-1">
                      <FiMapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{fc.address || 'View details'}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-br from-[#F2A93E]/5 to-[#F07054]/5 rounded-[15px] border-2 border-dashed border-orange-200">
              <FiGrid className="w-12 h-12 text-[#F2A93E] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Food Courts Coming Soon</h3>
              <p className="text-gray-600 mb-4">Multi-restaurant ordering with a single payment</p>
              <Link
                to="/food-courts"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white font-bold rounded-full hover:shadow-lg transition-all"
              >
                <span>Browse Food Courts</span>
                <FiArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}

          {/* Mobile CTA */}
          <div className="sm:hidden text-center mt-8">
            <Link
              to="/food-courts"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white font-bold rounded-full hover:shadow-lg transition-all"
            >
              <span>Explore Food Courts</span>
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Order delicious food in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-4">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F2A93E] to-[#F07054] text-white rounded-full flex items-center justify-center mb-6 text-3xl font-bold shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Choose Restaurant
              </h3>
              <p className="text-gray-600">
                Browse through thousands of restaurants and select your favorite one.
              </p>
            </div>

            {/* Arrow (hidden on mobile) */}
            <div className="hidden md:flex items-center justify-center">
              <FiArrowRight className="w-8 h-8 text-[#F2A93E]" />
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F2A93E] to-[#F07054] text-white rounded-full flex items-center justify-center mb-6 text-3xl font-bold shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Select Menu
              </h3>
              <p className="text-gray-600">
                Choose your favorite dishes from the restaurant's menu.
              </p>
            </div>

            {/* Arrow (hidden on mobile) */}
            <div className="hidden md:flex items-center justify-center">
              <FiArrowRight className="w-8 h-8 text-[#F2A93E]" />
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F2A93E] to-[#F07054] text-white rounded-full flex items-center justify-center mb-6 text-3xl font-bold shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Fast Delivery
              </h3>
              <p className="text-gray-600">
                Track your order and get your food delivered hot and fresh.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CATEGORIES SECTION ==================== */}
      <section className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
            Order by Cuisine
          </h2>

          {/* Scrollable Categories */}
          <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
            <div className="flex md:grid md:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-3 min-w-max md:min-w-0">
              {categories.map((category, idx) => (
                <Link
                  key={idx}
                  to={`/restaurants?cuisine=${category.cuisine}`}
                  className="flex-shrink-0 md:flex-shrink group"
                >
                  <div className="w-24 h-24 md:w-full bg-white rounded-[15px] border-2 border-dashed border-[#F2A93E] hover:border-[#F07054] hover:shadow-lg transition-all duration-300 flex flex-col items-center justify-center cursor-pointer transform group-hover:scale-105">
                    <div className="text-4xl mb-2 group-hover:scale-125 transition-transform">
                      {category.emoji}
                    </div>
                  </div>
                  <p className="text-center mt-2 font-semibold text-gray-900 text-sm md:text-base">
                    {category.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURED RESTAURANTS ==================== */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Featured Restaurants
              </h2>
              <p className="text-gray-600">
                Popular picks from our community
              </p>
            </div>
            <Link
              to="/restaurants"
              className="hidden sm:flex items-center space-x-2 text-[#F2A93E] hover:text-[#F07054] font-semibold transition-colors"
            >
              <span>View All</span>
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Restaurant Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              <>
                <RestaurantCardSkeleton />
                <RestaurantCardSkeleton />
                <RestaurantCardSkeleton />
                <RestaurantCardSkeleton />
              </>
            ) : restaurants.length > 0 ? (
              restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant._id} restaurant={restaurant} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600 text-lg">No restaurants available</p>
              </div>
            )}
          </div>

          {/* Mobile View All Link */}
          <div className="sm:hidden text-center mt-8">
            <Link
              to="/restaurants"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#F2A93E] text-white font-bold rounded-full hover:bg-[#F07054] transition-colors"
            >
              <span>View All Restaurants</span>
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== TODAY'S DEALS / OFFERS ==================== */}
      <section className="py-16 md:py-24 px-4 bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-black/5 rounded-full -ml-40 -mb-40 blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Today's Special Offer
              </h2>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Get an exclusive <span className="font-bold text-3xl">50% off</span> on your first order!
              </p>
              <p className="text-lg text-white/80 mb-8">
                Use code <span className="font-mono font-bold text-2xl bg-black/20 px-4 py-2 rounded-lg inline-block">FIRST50</span>
              </p>
              <Link
                to="/restaurants"
                className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-[#F07054] font-bold rounded-full hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span>Order Now & Save</span>
                <FiArrowRight className="w-5 h-5" />
              </Link>
            </div>

            {/* Right Illustration */}
            <div className="hidden md:flex items-center justify-center">
              <div className="relative w-64 h-64 flex items-center justify-center">
                <div className="absolute w-48 h-48 bg-white/20 rounded-full" />
                <div className="absolute text-8xl animate-bounce">
                  🎉
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TRENDING NOW ==================== */}
      <section className="py-16 md:py-24 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
            Trending Now
          </h2>

          {/* Trending Restaurants Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <>
                <RestaurantCardSkeleton />
                <RestaurantCardSkeleton />
                <RestaurantCardSkeleton />
                <RestaurantCardSkeleton />
              </>
            ) : trendingRestaurants.length > 0 ? (
              trendingRestaurants.map((restaurant) => (
                <HorizontalRestaurantCard
                  key={restaurant._id}
                  restaurant={restaurant}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-600 text-lg">No trending restaurants</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== APP DOWNLOAD CTA ==================== */}
      <section className="py-16 md:py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center bg-gradient-to-br from-gray-900 to-gray-800 rounded-[15px] overflow-hidden p-8 md:p-12">
            {/* Left Content */}
            <div className="text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Download the App
              </h2>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Get a better experience with exclusive app-only deals, faster ordering, and real-time tracking.
              </p>

              {/* App Store Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex items-center justify-center space-x-3 px-6 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-2xl">🍎</span>
                  <div className="text-left">
                    <div className="text-xs text-gray-600">Download on</div>
                    <div className="text-lg font-bold">App Store</div>
                  </div>
                </button>
                <button className="flex items-center justify-center space-x-3 px-6 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                  <span className="text-2xl">🤖</span>
                  <div className="text-left">
                    <div className="text-xs text-gray-600">Get it on</div>
                    <div className="text-lg font-bold">Google Play</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Right Phone Mockup */}
            <div className="hidden md:flex items-center justify-center">
              <div className="relative w-48 h-96 bg-gray-700 rounded-3xl border-8 border-gray-600 shadow-2xl overflow-hidden">
                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1/2 h-6 bg-gray-800 rounded-b-2xl z-10" />

                {/* Phone Screen Content */}
                <div className="w-full h-full bg-gradient-to-br from-[#F2A93E] to-[#F07054] flex items-center justify-center">
                  <FiSmartphone className="w-16 h-16 text-white/30" />
                </div>

                {/* Home Button */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-8 border-2 border-gray-600 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Company Info */}
            <div>
              <h3 className="text-2xl font-bold mb-4 text-[#F2A93E]">SkipQ</h3>
              <p className="text-gray-400 mb-4">
                Delivering delicious food to your doorstep, one order at a time.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-[#F2A93E] transition-colors text-xl">
                  f
                </a>
                <a href="#" className="text-gray-400 hover:text-[#F2A93E] transition-colors text-xl">
                  𝕏
                </a>
                <a href="#" className="text-gray-400 hover:text-[#F2A93E] transition-colors text-xl">
                  📷
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-[#F2A93E] transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#F2A93E] transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#F2A93E] transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#F2A93E] transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-lg mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#F2A93E] transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#F2A93E] transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-[#F2A93E] transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-bold text-lg mb-4">Newsletter</h4>
              <p className="text-gray-400 mb-4 text-sm">
                Subscribe for exclusive offers and updates
              </p>
              <form className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-4 py-2 rounded-l-lg text-gray-900 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F2A93E] hover:bg-[#F07054] rounded-r-lg font-bold transition-colors"
                >
                  →
                </button>
              </form>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800 pt-8">
            {/* Footer Bottom */}
            <div className="flex flex-col md:flex-row items-center justify-between">
              <p className="text-gray-400 text-sm">
                © 2024 SkipQ. All rights reserved.
              </p>
              <div className="flex items-center space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-[#F2A93E] text-sm transition-colors">
                  Sitemap
                </a>
                <a href="#" className="text-gray-400 hover:text-[#F2A93E] text-sm transition-colors">
                  Accessibility
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
