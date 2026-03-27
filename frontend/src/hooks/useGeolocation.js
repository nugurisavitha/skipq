import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const GEOCODE_API = 'https://nominatim.openstreetmap.org/reverse';

export function useGeolocation() {
  const [location, setLocation] = useState(null); // { lat, lng }
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState(null); // 'granted' | 'denied' | 'prompt'

  // Check permission status
  const checkPermission = useCallback(async () => {
    if (!navigator.permissions) return 'prompt';
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(result.state);
      result.onchange = () => setPermissionStatus(result.state);
      return result.state;
    } catch {
      return 'prompt';
    }
  }, []);

  // Reverse geocode coordinates to address string
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const response = await fetch(
        `${GEOCODE_API}?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await response.json();
      if (data?.display_name) {
        return data.display_name;
      }
      if (data?.address) {
        const a = data.address;
        const parts = [
          a.road,
          a.neighbourhood || a.suburb,
          a.city || a.town || a.village,
          a.state,
          a.postcode,
        ].filter(Boolean);
        return parts.join(', ');
      }
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      const msg = 'Geolocation is not supported by your browser';
      setError(msg);
      toast.error(msg);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 min cache
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;
      setLocation({ lat, lng });
      setPermissionStatus('granted');

      // Reverse geocode to get address
      const addr = await reverseGeocode(lat, lng);
      setAddress(addr);
      setLoading(false);

      return { lat, lng, address: addr };
    } catch (err) {
      setLoading(false);
      let msg = 'Failed to get location';
      switch (err.code) {
        case err.PERMISSION_DENIED:
          msg = 'Location permission denied. Please enable it in your browser settings.';
          setPermissionStatus('denied');
          break;
        case err.POSITION_UNAVAILABLE:
          msg = 'Location unavailable. Please try again.';
          break;
        case err.TIMEOUT:
          msg = 'Location request timed out. Please try again.';
          break;
      }
      setError(msg);
      toast.error(msg);
      return null;
    }
  }, [reverseGeocode]);

  return {
    location,
    address,
    loading,
    error,
    permissionStatus,
    getCurrentLocation,
    checkPermission,
    setAddress,
  };
}
