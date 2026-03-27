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
      } catch (err) {
        console.error('Failed to load cart:', err);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ items, restaurantId, restaurantData, dineInInfo }),
    );
  }, [items, restaurantId, restaurantData, dineInInfo]);

  // Normalize MongoDB _id to id for consistent usage
  const getId = (obj) => obj._id || obj.id;

  const addItem = (item, restaurantInfo) => {
    const restId = getId(restaurantInfo);
    const itemId = getId(item);

    // Check if adding from different restaurant
    if (restaurantId && restaurantId !== restId) {
      throw new Error('You can only order from one restaurant at a time');
    }

    setRestaurantId(restId);
    setRestaurantData({ ...restaurantInfo, id: restId });

    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.id === itemId);

      if (existingItem) {
        // If item exists, increase quantity
        return prevItems.map((i) =>
          i.id === itemId
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i,
        );
      }

      // Add new item with normalized id
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
  };

  const getSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    return Math.round(getSubtotal() * TAX_RATE * 100) / 100;
  };

  const getDeliveryFee = () => {
    return items.length > 0 ? DELIVERY_FEE : 0;
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
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTax,
    getDeliveryFee,
    getTotal,
    getItemCount,
    isEmpty: items.length === 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
