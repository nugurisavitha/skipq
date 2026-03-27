import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiSearch,
  FiShoppingCart,
  FiPlus,
  FiMinus,
  FiFilter,
  FiClock,
  FiMapPin,
  FiGrid,
  FiCheck,
  FiX,
  FiStar,
  FiNavigation,
} from 'react-icons/fi';
import { foodCourtsAPI } from '../../services/api';
import { useGeolocation } from '../../hooks/useGeolocation';

const FoodCourtDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCurrentLocation, checkPermission } = useGeolocation();

  // State management
  const [foodCourt, setFoodCourt] = useState(null);
  const [menuData, setMenuData] = useState([]);
  const [cart, setCart] = useState({});
  const [activeRestaurant, setActiveRestaurant] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUserHere, setIsUserHere] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('foodCourtCart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        if (parsedCart.foodCourtId === id) {
          setCart(parsedCart);
        }
      } catch (e) {
        console.error('Error loading cart:', e);
      }
    }
  }, [id]);

  // Save cart to localStorage
  useEffect(() => {
    if (Object.keys(cart).length > 0 || cart.items?.length > 0) {
      localStorage.setItem('foodCourtCart', JSON.stringify(cart));
    }
  }, [cart]);

  // Fetch food court and menu data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fcRes = await foodCourtsAPI.getById(id);
        const foodCourtData = fcRes.data?.data?.foodCourt || fcRes.data?.data;
        setFoodCourt(foodCourtData);

        const menuRes = await foodCourtsAPI.getMenu(id);
        const menuDataArray = menuRes.data?.data?.menu || menuRes.data?.data || [];
        setMenuData(Array.isArray(menuDataArray) ? menuDataArray : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching food court:', err);
        setError('Failed to load food court details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Check if user is physically at this food court
  useEffect(() => {
    if (!foodCourt?.location?.coordinates) return;
    const detectPresence = async () => {
      const status = await checkPermission();
      if (status !== 'granted') return;
      try {
        const loc = await getCurrentLocation();
        if (loc) {
          const [fcLng, fcLat] = foodCourt.location.coordinates;
          // Haversine-like quick distance check (meters)
          const R = 6371000;
          const dLat = ((loc.lat - fcLat) * Math.PI) / 180;
          const dLng = ((loc.lng - fcLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((fcLat * Math.PI) / 180) *
              Math.cos((loc.lat * Math.PI) / 180) *
              Math.sin(dLng / 2) ** 2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          setIsUserHere(dist <= 500); // within 500m
        }
      } catch {
        // silently fail
      }
    };
    detectPresence();
  }, [foodCourt]);

  // Cart helper functions
  const addItem = (menuItem, restaurant) => {
    const itemKey = `${menuItem._id || menuItem.id}`;
    const existingItem = cart.items?.find((item) => item.menuItemId === itemKey);

    const updatedCart = {
      foodCourtId: id,
      foodCourtName: foodCourt?.name || '',
      items: cart.items || [],
    };

    if (existingItem) {
      updatedCart.items = updatedCart.items.map((item) =>
        item.menuItemId === itemKey ? { ...item, quantity: item.quantity + 1 } : item
      );
    } else {
      updatedCart.items.push({
        menuItemId: itemKey,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        restaurantId: restaurant._id || restaurant.id,
        restaurantName: restaurant.name,
        image: menuItem.image || null,
        isVeg: menuItem.isVeg || false,
      });
    }

    setCart(updatedCart);
  };

  const removeItem = (menuItemId) => {
    const updatedCart = {
      ...cart,
      items: (cart.items || []).filter((item) => item.menuItemId !== menuItemId),
    };
    setCart(updatedCart);
  };

  const updateQuantity = (menuItemId, quantity) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }

    const updatedCart = {
      ...cart,
      items: (cart.items || []).map((item) =>
        item.menuItemId === menuItemId ? { ...item, quantity } : item
      ),
    };
    setCart(updatedCart);
  };

  const getItemCount = () => {
    return (cart.items || []).reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotal = () => {
    return (cart.items || []).reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getRestaurantCount = () => {
    const restaurants = new Set((cart.items || []).map((item) => item.restaurantId));
    return restaurants.size;
  };

  const getItemQuantity = (menuItemId) => {
    const item = (cart.items || []).find((item) => item.menuItemId === menuItemId);
    return item?.quantity || 0;
  };

  // Filter menu based on active restaurant and search
  const filteredMenuData =
    activeRestaurant === 'all'
      ? menuData
      : menuData.filter((section) => section.restaurant._id === activeRestaurant || section.restaurant.id === activeRestaurant);

  const filteredMenuWithSearch = filteredMenuData.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((section) => section.items.length > 0);

  // Get unique restaurants for filter tabs
  const restaurants = menuData.map((section) => section.restaurant);
  const uniqueRestaurants = Array.from(
    new Map(restaurants.map((r) => [r._id || r.id, r])).values()
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#F2A93E]"></div>
          <p className="mt-4 text-gray-600 font-poppins">Loading food court...</p>
        </div>
      </div>
    );
  }

  if (error || !foodCourt) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 font-poppins mb-4">{error || 'Food court not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-[#F2A93E] text-white rounded-lg font-poppins"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      {/* Header */}
      <div className="relative">
        {/* Hero image or gradient */}
        <div className="relative h-56 bg-gradient-to-r from-[#F2A93E] to-[#F07054] overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-pattern"></div>
          </div>

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-10 p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
          >
            <FiArrowLeft size={24} className="text-[#F07054]" />
          </button>

          {/* Cart icon */}
          {getItemCount() > 0 && (
            <button
              onClick={() => navigate('/food-court-cart')}
              className="absolute top-4 right-4 z-10 p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow relative"
            >
              <FiShoppingCart size={24} className="text-[#F07054]" />
              <span className="absolute top-0 right-0 bg-[#F07054] text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                {getItemCount()}
              </span>
            </button>
          )}

          {/* Food court image if available */}
          {foodCourt.image && (
            <img
              src={foodCourt.image}
              alt={foodCourt.name}
              className="w-full h-full object-cover absolute inset-0"
            />
          )}
        </div>

        {/* Food court info card */}
        <div className="relative px-4 -mt-8 mb-6">
          <div className={`bg-white rounded-[15px] p-6 shadow-lg border-2 border-dashed ${isUserHere ? 'border-green-400' : 'border-orange-200'}`}>
            {isUserHere && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full mb-3">
                <FiNavigation className="w-3 h-3" />
                YOU ARE HERE
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 mb-2 font-poppins">
              {foodCourt.name}
            </h1>

            <div className="flex items-center text-gray-600 mb-2 font-poppins text-sm">
              <FiMapPin size={16} className="mr-2 text-[#F2A93E]" />
              <span>{foodCourt.address || 'Address not available'}</span>
            </div>

            {foodCourt.operatingHours && (
              <div className="flex items-center text-gray-600 font-poppins text-sm">
                <FiClock size={16} className="mr-2 text-[#F2A93E]" />
                <span>{foodCourt.operatingHours}</span>
              </div>
            )}

            {foodCourt.rating && (
              <div className="flex items-center mt-3">
                <FiStar size={18} className="text-yellow-400 mr-2 fill-current" />
                <span className="font-poppins font-semibold text-gray-900">
                  {foodCourt.rating}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="sticky top-0 z-20 bg-white shadow-sm px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full py-3 pl-10 pr-4 rounded-lg bg-gray-100 border border-gray-200 focus:outline-none focus:border-[#F2A93E] focus:bg-white font-poppins text-sm"
          />
          <FiSearch size={18} className="absolute left-3 top-3.5 text-gray-400" />
        </div>
      </div>

      {/* Restaurant filter tabs */}
      <div className="sticky top-16 z-20 bg-white border-b border-gray-100 overflow-x-auto">
        <div className="flex gap-3 px-4 py-4 min-w-min">
          <button
            onClick={() => setActiveRestaurant('all')}
            className={`px-4 py-2 rounded-full font-poppins font-medium whitespace-nowrap transition-all ${
              activeRestaurant === 'all'
                ? 'bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Restaurants
          </button>

          {uniqueRestaurants.map((restaurant) => (
            <button
              key={restaurant._id || restaurant.id}
              onClick={() => setActiveRestaurant(restaurant._id || restaurant.id)}
              className={`px-4 py-2 rounded-full font-poppins font-medium whitespace-nowrap transition-all ${
                activeRestaurant === (restaurant._id || restaurant.id)
                  ? 'bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {restaurant.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu sections */}
      <div className="px-4 py-6 space-y-8">
        {filteredMenuWithSearch.length === 0 ? (
          <div className="text-center py-12">
            <FiGrid size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-poppins">
              {searchTerm ? 'No items found matching your search' : 'No restaurants available'}
            </p>
          </div>
        ) : (
          filteredMenuWithSearch.map((section, idx) => (
            <div key={idx} className="border-2 border-dashed border-orange-200 rounded-[15px] p-6">
              {/* Restaurant header */}
              <div className="mb-6 pb-4 border-b-2 border-gray-100">
                <div className="flex items-start gap-4 mb-4">
                  {section.restaurant.logo && (
                    <img
                      src={section.restaurant.logo}
                      alt={section.restaurant.name}
                      className="w-16 h-16 rounded-[12px] object-cover shadow-md"
                    />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 font-poppins mb-2">
                      {section.restaurant.name}
                    </h2>
                    {section.restaurant.cuisine && (
                      <div className="flex gap-2 flex-wrap">
                        {Array.isArray(section.restaurant.cuisine)
                          ? section.restaurant.cuisine.map((c) => (
                              <span
                                key={c}
                                className="text-xs bg-orange-100 text-[#F07054] px-3 py-1 rounded-full font-poppins font-medium"
                              >
                                {c}
                              </span>
                            ))
                          : (
                              <span className="text-xs bg-orange-100 text-[#F07054] px-3 py-1 rounded-full font-poppins font-medium">
                                {section.restaurant.cuisine}
                              </span>
                            )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu items grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {section.items.map((item) => {
                  const quantity = getItemQuantity(item._id || item.id);
                  return (
                    <div
                      key={item._id || item.id}
                      className="bg-white rounded-[12px] overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
                    >
                      {/* Item image */}
                      <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FiGrid size={32} className="text-gray-300" />
                          </div>
                        )}

                        {/* Veg/Non-veg indicator */}
                        <div className="absolute top-2 right-2">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              item.isVeg
                                ? 'border-green-500 bg-green-50'
                                : 'border-red-500 bg-red-50'
                            }`}
                          >
                            <div
                              className={`w-3 h-3 rounded-full ${
                                item.isVeg ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Item details */}
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 font-poppins text-sm mb-1 line-clamp-2">
                          {item.name}
                        </h3>

                        {item.description && (
                          <p className="text-xs text-gray-500 font-poppins mb-2 line-clamp-1">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-[#F07054] font-poppins text-lg">
                            ₹{item.price}
                          </span>
                        </div>

                        {/* Add to cart controls */}
                        {quantity === 0 ? (
                          <button
                            onClick={() => addItem(item, section.restaurant)}
                            className="w-full py-2 bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white rounded-lg font-poppins font-semibold text-sm hover:shadow-md transition-shadow flex items-center justify-center gap-2"
                          >
                            <FiPlus size={16} />
                            Add
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 bg-gradient-to-r from-[#F2A93E] to-[#F07054] rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(item._id || item.id, quantity - 1)}
                              className="flex-1 py-1.5 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors flex items-center justify-center"
                            >
                              <FiMinus size={16} />
                            </button>
                            <span className="text-white font-bold font-poppins text-sm min-w-[2rem] text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item._id || item.id, quantity + 1)}
                              className="flex-1 py-1.5 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors flex items-center justify-center"
                            >
                              <FiPlus size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating cart summary bar */}
      {getItemCount() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-orange-200 shadow-xl">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-poppins text-sm text-gray-600 mb-1">
                  <span className="font-bold text-gray-900 text-lg">
                    {getItemCount()}
                  </span>
                  {' items from '}
                  <span className="font-bold text-gray-900">
                    {getRestaurantCount()}
                  </span>
                  {' restaurant' + (getRestaurantCount() === 1 ? '' : 's')}
                </p>
                <p className="font-poppins text-2xl font-bold text-[#F07054]">
                  ₹{getTotal().toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => navigate('/food-court-cart')}
                className="px-6 py-3 bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white rounded-lg font-poppins font-bold text-sm hover:shadow-lg transition-shadow flex items-center gap-2 whitespace-nowrap"
              >
                <FiShoppingCart size={18} />
                View Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodCourtDetailPage;
