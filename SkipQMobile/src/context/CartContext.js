import React, { createContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CartContext = createContext(null);

const DELIVERY_FEE = 40;
const TAX_RATE = 0.05;
const STORAGE_KEY = 'skipq_cart';

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [restaurantData, setRestaurantData] = useState(null);
  const [dineInInfo, setDineInInfo] = useState(null);
  const [foodCourtId, setFoodCourtId] = useState(null);

  // Refs to always have current values (avoids stale closure issues)
  const foodCourtIdRef = useRef(foodCourtId);
  const restaurantIdRef = useRef(restaurantId);
  useEffect(() => { foodCourtIdRef.current = foodCourtId; }, [foodCourtId]);
  useEffect(() => { restaurantIdRef.current = restaurantId; }, [restaurantId]);

  // Restore cart
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setItems(parsed.items || []);
          setRestaurantId(parsed.restaurantId || null);
          setRestaurantData(parsed.restaurantData || null);
          setDineInInfo(parsed.dineInInfo || null);
          setFoodCourtId(parsed.foodCourtId || null);
        } catch {}
      }
    });
  }, []);

  // Persist cart
  useEffect(() => {
    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ items, restaurantId, restaurantData, dineInInfo, foodCourtId }),
    );
  }, [items, restaurantId, restaurantData, dineInInfo, foodCourtId]);

  const addItem = (item, restaurant, fcId = null) => {
    const restId = String(restaurant._id || restaurant.id);
    const itemId = String(item._id || item.id);

    // Use refs to get the absolute latest values (avoids stale closure)
    const currentFoodCourtId = foodCourtIdRef.current;
    const currentRestaurantId = restaurantIdRef.current;

    // Determine if this is a food court order:
    // either explicitly passed fcId, or cart already has foodCourtId
    const isFoodCourtOrder = !!(fcId || currentFoodCourtId);

    // Food court orders allow multiple restaurants
    if (isFoodCourtOrder) {
      const activeFcId = fcId || currentFoodCourtId;
      setFoodCourtId(activeFcId);
      foodCourtIdRef.current = activeFcId;
      // Set restaurantId/Data to first restaurant added (for backward compat)
      if (!currentRestaurantId) {
        setRestaurantId(restId);
        restaurantIdRef.current = restId;
        setRestaurantData(restaurant);
      }
      setItems((prev) => {
        const idx = prev.findIndex((i) => String(i._id || i.id) === itemId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
          return updated;
        }
        return [...prev, {
          ...item,
          _id: itemId,
          quantity: 1,
          restaurantId: restId,
          restaurantName: restaurant.name || '',
          restaurantSlug: restaurant.slug || '',
        }];
      });
      return 'added';
    }

    // Non-food-court: single restaurant restriction
    if (currentRestaurantId && currentRestaurantId !== restId) {
      // Different restaurant — clear first
      setItems([{ ...item, _id: itemId, quantity: 1 }]);
      setRestaurantId(restId);
      restaurantIdRef.current = restId;
      setRestaurantData(restaurant);
      setFoodCourtId(null);
      foodCourtIdRef.current = null;
      return 'switched';
    }
    if (!currentRestaurantId) {
      setRestaurantId(restId);
      restaurantIdRef.current = restId;
      setRestaurantData(restaurant);
    }
    setFoodCourtId(null);
    foodCourtIdRef.current = null;
    setItems((prev) => {
      const idx = prev.findIndex((i) => String(i._id || i.id) === itemId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        return updated;
      }
      return [...prev, { ...item, _id: itemId, quantity: 1 }];
    });
    return 'added';
  };

  const removeItem = (itemId) => {
    setItems((prev) => prev.filter((i) => i._id !== itemId));
  };

  const updateQuantity = (itemId, qty) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i._id !== itemId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i._id === itemId ? { ...i, quantity: qty } : i)),
    );
  };

  const clearCart = () => {
    setItems([]);
    setRestaurantId(null);
    setRestaurantData(null);
    setDineInInfo(null);
    setFoodCourtId(null);
    foodCourtIdRef.current = null;
    restaurantIdRef.current = null;
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

  const getSubtotal = () => items.reduce((s, i) => s + i.price * i.quantity, 0);
  const getTax = () => getSubtotal() * TAX_RATE;
  const getDeliveryFee = () => (items.length > 0 && !foodCourtId ? DELIVERY_FEE : 0);
  const getTotal = () => getSubtotal() + getTax() + getDeliveryFee();
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
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
        itemCount,
      }}>
      {children}
    </CartContext.Provider>
  );
};
