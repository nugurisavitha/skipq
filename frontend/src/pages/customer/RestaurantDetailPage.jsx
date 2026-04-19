import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiStar,
  FiMapPin,
  FiClock,
  FiShoppingCart,
  FiPlus,
  FiMinus,
  FiCheck,
  FiAlertCircle,
  FiX,
  FiSmartphone,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { addHours, format, isBefore, isAfter } from 'date-fns';
import api from '../../services/api';
import { useCart } from '../../hooks/useCart';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

export default function RestaurantDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addItem, restaurantId, setDineInInfo, setFoodCourtId } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [activeTab, setActiveTab] = useState('menu');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal and form states
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemQuantity, setItemQuantity] = useState(1);

  // Read QR scan params from URL: ?orderType=dine_in&table=5
  const qrOrderType = searchParams.get('orderType');
  const qrTable = searchParams.get('table');
  const urlFoodCourtId = searchParams.get('foodCourtId');
  const isDineInFromQR = qrOrderType === 'dine_in';

  const [orderType, setOrderType] = useState(isDineInFromQR ? 'dine_in' : 'delivery');
  const [dineInTime, setDineInTime] = useState('');
  const [tableNumber, setTableNumber] = useState(qrTable || '');

  // Persist dine-in info in cart context when coming from QR scan
  // Also include selfService flag once restaurant data loads
  useEffect(() => {
    if (isDineInFromQR) {
      setDineInInfo({
        orderType: 'dine_in',
        tableNumber: qrTable || null,
        selfService: restaurant?.selfService || false,
      });
    }
  }, [isDineInFromQR, qrTable, setDineInInfo, restaurant?.selfService]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Fetch restaurant and menu
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const restaurantRes = await api.restaurants.getBySlug(slug);
        const restaurantData = restaurantRes.data?.data?.restaurant || restaurantRes.data?.data || restaurantRes.data;
        setRestaurant(restaurantData);

        const menuRes = await api.menu.getByRestaurant(restaurantData._id);
        const items = menuRes.data?.data?.menuItems || menuRes.data?.data || [];
        setMenuItems(items);

        // Set first category as default
        const categories = [...new Set(items.map((item) => item.category))];
        if (categories.length > 0) {
          setSelectedCategory(categories[0]);
        }
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load restaurant';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleAddItem = (item) => {
    const restId = restaurant._id || restaurant.id;
    if (restaurantId && restaurantId !== restId) {
      toast.error('You can only order from one restaurant at a time');
      return;
    }
    setSelectedItem(item);
    setItemQuantity(1);
  };

  const handleConfirmAdd = () => {
    try {
      const itemToAdd = {
        ...selectedItem,
        id: selectedItem._id || selectedItem.id,
        quantity: itemQuantity,
      };
      addItem(itemToAdd, {
        id: restaurant._id || restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        selfService: restaurant.selfService || false,
      }, urlFoodCourtId || null);
      toast.success(`${selectedItem.name} added to cart`);
      setSelectedItem(null);
      setItemQuantity(1);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getMinDineInTime = () => {
    const now = new Date();
    const fifteenMinutesLater = addHours(now, 0.25);
    return fifteenMinutesLater;
  };

  const isRestaurantOpen = () => {
    if (!restaurant?.openingHours || !restaurant?.closingHours) return true;
    const now = new Date();
    const openTime = new Date();
    const [openHour, openMin] = restaurant.openingHours.split(':');
    openTime.setHours(parseInt(openHour), parseInt(openMin), 0);

    const closeTime = new Date();
    const [closeHour, closeMin] = restaurant.closingHours.split(':');
    closeTime.setHours(parseInt(closeHour), parseInt(closeMin), 0);

    return isAfter(now, openTime) && isBefore(now, closeTime);
  };

  // Group menu items by category
  const categories = [...new Set(menuItems.map((item) => item.category))];
  const itemsByCategory = categories.reduce((acc, category) => {
    acc[category] = menuItems.filter((item) => item.category === category);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate('/restaurants')}
            className="flex items-center space-x-2 text-primary hover:text-primary-dark mb-6"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back to Restaurants</span>
          </button>
          <div className="text-center">
            <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Restaurant Not Found</h1>
            <p className="text-gray-600 mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Image with Gradient Overlay */}
      <div className="relative h-96 overflow-hidden">
        <img
          src={restaurant.image || 'https://via.placeholder.com/1200x400?text=Restaurant'}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => navigate('/restaurants')}
            className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
        </div>

        {/* Restaurant Name & Rating Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
          <h1 className="text-4xl font-bold text-white mb-2">{restaurant.name}</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1 bg-yellow-400/20 backdrop-blur px-3 py-1.5 rounded-full">
              <FiStar className="w-4 h-4 text-yellow-300 fill-current" />
              <span className="font-bold text-yellow-100">{restaurant.rating || 4.5}</span>
              <span className="text-xs text-yellow-100 ml-1">({restaurant.reviewCount || 100}+)</span>
            </div>
            {isRestaurantOpen() ? (
              <span className="text-green-300 font-semibold text-sm flex items-center">
                <FiCheck className="w-4 h-4 mr-1" />
                Open Now
              </span>
            ) : (
              <span className="text-red-300 font-semibold text-sm">Closed</span>
            )}
            {restaurant.selfService && (
              <span className="bg-blue-500/30 backdrop-blur text-blue-100 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1">
                <FiSmartphone className="w-3 h-3" />
                <span>Self-Service</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dine-In Banner (from QR code scan) */}
      {isDineInFromQR && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <FiCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  Dine-In Mode
                  {qrTable ? ` — Table ${qrTable}` : ''}
                </p>
                <p className="text-xs text-white/80">
                  Your order will be linked to {qrTable ? `table ${qrTable}` : 'this restaurant'}
                </p>
              </div>
            </div>
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold">
              {qrTable ? `Table ${qrTable}` : 'Walk-in'}
            </span>
          </div>
        </div>
      )}

      {/* Self-Service Banner (when restaurant supports it and user isn't already in dine-in QR mode) */}
      {restaurant.selfService && !isDineInFromQR && (
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <FiSmartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">Self-Service Available</p>
                <p className="text-xs text-white/80">
                  Order from your phone, pick up when ready — no waiting!
                </p>
              </div>
            </div>
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs font-bold">
              Order & Pickup
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border-2 border-dashed border-primary/30 rounded-[15px] p-4 text-center">
            <FiClock className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-gray-600">Delivery</p>
            <p className="font-bold text-gray-900">{restaurant.deliveryTime || 30} mins</p>
          </div>
          <div className="border-2 border-dashed border-primary/30 rounded-[15px] p-4 text-center">
            <FiMapPin className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-gray-600">Distance</p>
            <p className="font-bold text-gray-900">{restaurant.distance ? `${restaurant.distance} km` : 'Nearby'}</p>
          </div>
          <div className="border-2 border-dashed border-primary/30 rounded-[15px] p-4 text-center">
            <div className="w-6 h-6 text-primary mx-auto mb-2 flex items-center justify-center">🍴</div>
            <p className="text-sm text-gray-600">Cuisines</p>
            <p className="font-bold text-gray-900 text-xs">{restaurant.cuisines?.length > 0 ? restaurant.cuisines.join(', ') : 'Various'}</p>
          </div>
        </div>

        {restaurant.description && (
          <p className="text-gray-700 mb-8 leading-relaxed">{restaurant.description}</p>
        )}

        {/* Tabs */}
        <div className="border-b-2 border-gray-200 mb-8 flex space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('menu')}
            className={`py-4 font-semibold transition-colors whitespace-nowrap pb-4 border-b-2 ${
              activeTab === 'menu'
                ? 'text-primary border-primary'
                : 'text-gray-600 border-transparent hover:text-primary'
            }`}
          >
            Menu
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`py-4 font-semibold transition-colors whitespace-nowrap pb-4 border-b-2 ${
              activeTab === 'info'
                ? 'text-primary border-primary'
                : 'text-gray-600 border-transparent hover:text-primary'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-4 font-semibold transition-colors whitespace-nowrap pb-4 border-b-2 ${
              activeTab === 'reviews'
                ? 'text-primary border-primary'
                : 'text-gray-600 border-transparent hover:text-primary'
            }`}
          >
            Reviews
          </button>
        </div>

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Category Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-4 py-3 rounded-[15px] font-medium transition-all ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md'
                        : 'bg-white border-2 border-dashed border-gray-200 text-gray-900 hover:border-primary'
                    }`}
                  >
                    {category}
                    <span className="ml-2 text-sm opacity-80">
                      ({itemsByCategory[category]?.length || 0})
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Menu Items */}
            <div className="lg:col-span-3 space-y-4">
              {selectedCategory &&
                itemsByCategory[selectedCategory]?.map((item) => (
                  <div
                    key={item._id || item.id}
                    className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-4 flex items-center justify-between hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        {item.isVeg ? (
                          <div className="w-4 h-4 border-2 border-green-600 rounded-sm flex-shrink-0"></div>
                        ) : (
                          <div className="w-4 h-4 bg-red-600 rounded-sm flex-shrink-0"></div>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-lg text-primary">₹{item.price}</span>
                        {item.discountPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            ₹{item.discountPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {item.image && (
                      <div className="ml-4 flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-24 h-24 object-cover rounded-[12px]"
                        />
                      </div>
                    )}

                    <button
                      onClick={() => handleAddItem(item)}
                      className="ml-4 p-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-full hover:shadow-lg transition-all flex-shrink-0"
                    >
                      <FiPlus className="w-5 h-5" />
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <FiClock className="w-5 h-5 text-primary mr-2" />
                Hours
              </h2>
              <div className="text-gray-600">
                {restaurant.openingHours && restaurant.closingHours ? (
                  <p className="font-medium">{restaurant.openingHours} - {restaurant.closingHours}</p>
                ) : (
                  <p>Hours not available</p>
                )}
              </div>
            </div>

            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <FiMapPin className="w-5 h-5 text-primary mr-2" />
                Location
              </h2>
              <p className="text-gray-600 leading-relaxed">{restaurant.address || 'Address not provided'}</p>
            </div>

            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Contact</h2>
              <p className="text-gray-600 font-medium">{restaurant.phone || 'Phone not provided'}</p>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="max-w-2xl bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6 text-center">
            <p className="text-gray-600 mb-2">Reviews feature coming soon.</p>
            <p className="text-lg font-bold text-primary">Current rating: {restaurant.rating || 4.5}/5</p>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.name || ''}
      >
        <div className="space-y-6">
          {selectedItem?.image && (
            <img
              src={selectedItem.image}
              alt={selectedItem.name}
              className="w-full h-64 object-cover rounded-[15px]"
            />
          )}

          <div>
            <p className="text-gray-600 mb-3">{selectedItem?.description}</p>
            <div className="flex items-center space-x-3">
              <span className="font-bold text-2xl text-primary">
                ₹{selectedItem?.price}
              </span>
              {selectedItem?.originalPrice && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{selectedItem.originalPrice}
                </span>
              )}
            </div>
          </div>

          {/* Quantity Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Quantity
            </label>
            <div className="flex items-center border-2 border-dashed border-orange-200 rounded-[12px] w-fit">
              <button
                onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                className="p-3 hover:bg-orange-50 transition-colors"
              >
                <FiMinus className="w-5 h-5 text-primary" />
              </button>
              <span className="px-6 py-2 font-bold text-gray-900 text-lg">{itemQuantity}</span>
              <button
                onClick={() => setItemQuantity(itemQuantity + 1)}
                className="p-3 hover:bg-orange-50 transition-colors"
              >
                <FiPlus className="w-5 h-5 text-primary" />
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleConfirmAdd}
            className="w-full bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-3 rounded-[15px] flex items-center justify-center space-x-2 hover:shadow-lg transition-all"
          >
            <FiShoppingCart className="w-5 h-5" />
            <span>Add to Cart</span>
          </button>
        </div>
      </Modal>
    </div>
  );
}
