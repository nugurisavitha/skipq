import React, { useState } from 'react';
import { FiNavigation, FiLoader, FiMapPin, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const GEOCODE_API = 'https://nominatim.openstreetmap.org/reverse';

/**
 * LocationPickerButton — A reusable location picker popup button.
 *
 * Props:
 * - onLocationSelect({ address, lat, lng }) — called when user confirms the location
 * - className — optional extra class for the wrapper
 * - buttonLabel — optional label override (default: "Use My Location")
 * - compact — if true, shows a smaller icon-only button
 */
export default function LocationPickerButton({
  onLocationSelect,
  className = '',
  buttonLabel,
  compact = false,
}) {
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState('');
  const [coords, setCoords] = useState(null);
  const [editedAddress, setEditedAddress] = useState('');

  const reverseGeocode = async (lat, lng) => {
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
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setDetectedAddress('');
    setShowPopup(true);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const { latitude: lat, longitude: lng } = position.coords;
      setCoords({ lat, lng });

      const addr = await reverseGeocode(lat, lng);
      setDetectedAddress(addr);
      setEditedAddress(addr);
    } catch (err) {
      let msg = 'Failed to get location';
      switch (err.code) {
        case 1: // PERMISSION_DENIED
          msg = 'Location permission denied. Please enable it in your browser settings.';
          break;
        case 2: // POSITION_UNAVAILABLE
          msg = 'Location unavailable. Please try again.';
          break;
        case 3: // TIMEOUT
          msg = 'Location request timed out. Please try again.';
          break;
      }
      toast.error(msg);
      setShowPopup(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (onLocationSelect) {
      onLocationSelect({
        address: editedAddress || detectedAddress,
        lat: coords?.lat || '',
        lng: coords?.lng || '',
      });
    }
    setShowPopup(false);
    toast.success('Location selected!');
  };

  const handleClose = () => {
    setShowPopup(false);
    setDetectedAddress('');
    setEditedAddress('');
    setCoords(null);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      {compact ? (
        <button
          type="button"
          onClick={handleDetectLocation}
          className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-lg transition-colors"
          title="Detect my location"
        >
          <FiNavigation size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleDetectLocation}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-dashed border-blue-200 text-blue-700 font-semibold rounded-[12px] hover:from-blue-100 hover:to-blue-150 transition-all"
        >
          <FiNavigation className="w-4 h-4" />
          <span>{buttonLabel || 'Use My Location'}</span>
        </button>
      )}

      {/* Location Popup / Modal */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-[15px] shadow-2xl w-full max-w-md overflow-hidden animate-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <FiMapPin className="w-5 h-5" />
                <h3 className="font-bold text-lg">Detect Location</h3>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white p-1"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <FiLoader className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                  <p className="text-gray-600 font-medium">Detecting your location...</p>
                  <p className="text-sm text-gray-400 mt-1">Please allow location access if prompted</p>
                </div>
              ) : detectedAddress ? (
                <>
                  {/* Coordinates Badge */}
                  {coords && (
                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-700 font-medium">
                        {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                      </span>
                    </div>
                  )}

                  {/* Editable Address */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Detected Address
                    </label>
                    <textarea
                      value={editedAddress}
                      onChange={(e) => setEditedAddress(e.target.value)}
                      rows="3"
                      className="w-full px-4 py-2.5 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-400 bg-blue-50/30 text-gray-800 resize-none"
                      placeholder="Edit address if needed..."
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      You can edit the address above before confirming
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      <FiMapPin className="w-4 h-4" />
                      Confirm Location
                    </button>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No location detected yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
