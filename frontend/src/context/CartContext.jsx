import React, { createContext, useState, useEffect } from 'react';

export const CartContext = createContext();

const STORAGE_KEY = 'skipq_cart';
const DELIVERY_FEE = 40;
const TAX_RATE = 0.05;

export default function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantData, setRestaurantData] = useState(null);

  // Dine-in info from QR code scan (persisted with cart)
  // { orderType: 'dine_in', tableNumber: '5' } or null
  const [dineInInfo, setDineInInfo] = useState(null);

  // Food court ID — when set, order is dine_in pickup with token
  const [foodCourtId, setFoodCourtId] = useState(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        setItems(cartData.items || []);
        setRestaurantId(cartData.restaurantId || null);
        setRestaurantData(cartData.restaurantData || null);
        setDineInInfo(cartData.dineInInfo || null);
        setFoodCourtId(cartData.foodCourtId || null);
      } catch (err) {
        console.error('Failed to load cart:', err);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ items, restaurantId, restaurantData, dineInInfo, foodCourtId }),
    );
  }, [items, restaurantId, restaurantData, dineInInfo, foodCourtId]);

  // Normalize MongoDB _id to id for consistent usage
  const getId = (obj) => obj._id || obj.id;

  const addItem = (item, restaurantInfo, fcId = null) => {
    const restId = getId(restaurantInfo);
    const itemId = getId(item);

    // Food court orders allow multiple restaurants
    if (fcId) {
      setFoodCourtId(fcId);
      if (!restaurantId) {
        setRestaurantId(restId);
        setRestaurantData({ ...restaurantInfo, id: restId });
      }
      setItems((prevItems) => {
        const existingItem = prevItems.find((i) => i.id === itemId);
        if (existingItem) {
          return prevItems.map((i) =>
            i.id === itemId
              ? { ...i, quantity: i.quantity + (item.quantity || 1) }
              : i,
          );
        }
        return [...prevItems, {
          ...item,
          id: itemId,
          quantity: item.quantity || 1,
          restaurantId: restId,
          restaurantName: restaurantInfo.name,
          restaurantSlug: restaurantInfo.slug,
        }];
      });
      return;
    }

    // Non-food-court: single restaurant restriction
    if (restaurantId && restaurantId !== restId) {
      throw new Error('You can only order from one restaurant at a time');
    }

    setRestaurantId(restId);
    setRestaurantData({ ...restaurantInfo, id: restId });
    setFoodCourtId(null);

    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === itemId);

      if (existingItem) {
        return prevItems.map((i) =>
          i.id === itemId
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i,
        );
      }

      return [...prevItems, { ...item, id: itemId, quantity: item.quantity || 1 }];
    });
  };

  const removeItem = (itemId) => {
    setItems((prevItems) => prevItems.filter((i) => i.id !== itemId));
    if (items.length === 1) {
      setRestaurantId(null);
      setRestaurantData(null);
    }
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((i) =>
        i.id === itemId ? { ...i, quantity } : i,
      ),
    );
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantData(null);
    setDineInInfo(null);
    setFoodCourtId(null);
  };

  // Group items by restaurant (for food court multi-restaurant orders)
  const getItemsByRestaurant = () => {
    const grouped = {};
    items.forEach((item) => {
      const rid = item.restaurantId || restaurantId;
      if (!grouped[rid]) {
        grouped[rid] = {
          restaurantId: rid,
          restaurantName: item.restaurantName || restaurantData?.name || 'Restaurant',
          restaurantSlug: item.restaurantSlug || restaurantData?.slug,
          items: [],
        };
      }
      grouped[rid].items.push(item);
    });
    return Object.values(grouped);
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    return Math.round(getSubtotal() * TAX_RATE * 100) / 100;
  };

  const getDeliveryFee = () => {
    return items.length > 0 && !foodCourtId ? DELIVERY_FEE : 0;
  };

  const getTotal = () => {
    return getSubtotal() + getTax() + getDeliveryFee();
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const value = {
    items,
    restaurantId,
    restaurantData,
    dineInInfo,
    setDineInInfo,
    foodCourtId,
    setFoodCourtId,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemsByRestaurant,
    getSubtotal,
    getTax,
    getDeliveryFee,
    getTotal,
    getItemCount,
    isEmpty: items.length === 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
