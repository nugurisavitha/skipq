import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  FiCamera,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiSmartphone,
  FiDownload,
  FiExternalLink,
  FiClock,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { qrAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function QRScanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();

  // Support both URL formats:
  // /scan?restaurant=slug&table=5  (legacy)
  // /scan/slug/5                   (new deep link format)
  const slug = params.slug || searchParams.get('restaurant');
  const tableNumber = params.tableNumber || searchParams.get('table');

  const [restaurant, setRestaurant] = useState(null);
  const [deepLinks, setDeepLinks] = useState(null);
  const [platform, setPlatform] = useState('desktop');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [redirectState, setRedirectState] = useState('detecting'); // detecting, trying_app, show_options
  const [countdown, setCountdown] = useState(3);

  // Detect platform on client side (more reliable than server for PWA/WebView)
  const detectPlatform = useCallback(() => {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    return 'desktop';
  }, []);

  // Try to open the native app
  const tryOpenApp = useCallback(
    (links) => {
      if (!links) return;

      const detectedPlatform = detectPlatform();
      setPlatform(detectedPlatform);

      if (detectedPlatform === 'desktop') {
        // On desktop, skip app attempt and go straight to web
        setRedirectState('show_options');
        return;
      }

      setRedirectState('trying_app');

      // For Android, use intent URL which has built-in fallback
      if (detectedPlatform === 'android') {
        // Try the intent URL — Android will open the app if installed,
        // or fall back to Play Store automatically
        const start = Date.now();

        // Create a hidden iframe to try the custom scheme
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = links.appScheme;
        document.body.appendChild(iframe);

        // If app opened, the page will be backgrounded
        // If not, show options after a short delay
        setTimeout(() => {
          document.body.removeChild(iframe);
          // If we're still here after 2.5s, the app didn't open
          if (Date.now() - start < 3000) {
            setRedirectState('show_options');
          }
        }, 2500);
      } else if (detectedPlatform === 'ios') {
        // For iOS, try Universal Link first, then custom scheme
        const start = Date.now();

        // Try custom URL scheme
        window.location.href = links.appScheme;

        // If the app isn't installed, iOS will just stay on the page
        // Check after a delay
        setTimeout(() => {
          // If we're still on this page, app didn't open
          if (document.visibilityState !== 'hidden') {
            setRedirectState('show_options');
          }
        }, 2500);
      }
    },
    [detectPlatform]
  );

  // Resolve deep link data from backend
  useEffect(() => {
    if (!slug) {
      setRedirectState('show_options');
      return;
    }

    const resolve = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await qrAPI.resolveDeepLink(slug, tableNumber);
        const data = response.data?.data || response.data;
        setRestaurant(data.restaurant);
        setDeepLinks(data.deepLinks);
        setPlatform(data.platform);
        setIsLoading(false);

        // After data loads, try to open the app
        tryOpenApp(data.deepLinks);
      } catch (err) {
        const message =
          err.response?.data?.message || 'Restaurant not found';
        setError(message);
        setIsLoading(false);
        toast.error(message);
      }
    };

    resolve();
  }, [slug, tableNumber, tryOpenApp]);

  // Countdown for auto-redirect to web menu
  useEffect(() => {
    if (redirectState !== 'show_options' || !restaurant) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-navigate to web menu
          handleContinueWeb();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [redirectState, restaurant]);

  // Navigate to web version of restaurant menu
  const handleContinueWeb = () => {
    if (!slug) {
      navigate('/restaurants');
      return;
    }
    // If table number exists, use dine-in mode with table
    // If no table (restaurant-only QR), just go to the restaurant page
    if (tableNumber) {
      navigate(
        `/restaurant/${slug}?orderType=dine_in&table=${encodeURIComponent(tableNumber)}`
      );
    } else {
      navigate(`/restaurant/${slug}`);
    }
  };

  // Redirect to appropriate store
  const handleDownloadApp = () => {
    if (!deepLinks) return;
    const detectedPlatform = detectPlatform();

    if (detectedPlatform === 'ios') {
      window.location.href = deepLinks.appStore;
    } else if (detectedPlatform === 'android') {
      window.location.href = deepLinks.playStore;
    } else {
      // Desktop — show both store links
      toast('Open this page on your phone to download the app');
    }
  };

  // Try opening app again
  const handleOpenApp = () => {
    if (!deepLinks) return;
    const detectedPlatform = detectPlatform();

    if (detectedPlatform === 'android') {
      window.location.href = deepLinks.androidIntent;
    } else if (detectedPlatform === 'ios') {
      window.location.href = deepLinks.appScheme;
    }
  };

  // ── Loading State ──
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <LoadingSpinner />
        <p className="mt-4 text-gray-600 animate-pulse">
          Finding your restaurant...
        </p>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="w-full max-w-md">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-primary hover:text-primary-dark mb-6 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div
            className="bg-white p-8 text-center"
            style={{ borderRadius: '15px', border: '2px solid #fecaca' }}
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiAlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Oops!
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>

            <button
              onClick={() => navigate('/restaurants')}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #F2A93E, #F07054)' }}
            >
              Browse Restaurants
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── No QR Params — Show scan instructions ──
  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="w-full max-w-md">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-primary hover:text-primary-dark mb-6 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div
            className="bg-white p-8"
            style={{ borderRadius: '15px', border: '2px dashed #fed7aa' }}
          >
            <div className="text-center mb-8">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'linear-gradient(135deg, #FEF3C7, #FBBF24)' }}
              >
                <FiCamera className="w-10 h-10 text-amber-700" />
              </div>
              <h1
                className="text-3xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Scan QR Code
              </h1>
              <p className="text-gray-600">
                Scan the QR code on the restaurant table to order
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-4 mb-8">
              {[
                {
                  step: 1,
                  title: 'Open your camera',
                  desc: "Use your phone's camera app or QR code scanner",
                },
                {
                  step: 2,
                  title: 'Point at the QR code',
                  desc: 'Look for the QR code on your table or menu card',
                },
                {
                  step: 3,
                  title: 'Start ordering!',
                  desc: "You'll be taken to the restaurant's menu automatically",
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div
                      className="flex items-center justify-center h-8 w-8 rounded-full text-white font-bold text-sm"
                      style={{ background: 'linear-gradient(135deg, #F2A93E, #F07054)' }}
                    >
                      {item.step}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/restaurants')}
                className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #F2A93E, #F07054)' }}
              >
                Browse Restaurants Instead
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-4 rounded-xl font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Smart Redirect Landing Page ──
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="w-full max-w-md">
        {/* SkipQ Logo/Brand */}
        <div className="text-center mb-6">
          <h2
            className="text-2xl font-extrabold"
            style={{
              fontFamily: 'Poppins, sans-serif',
              background: 'linear-gradient(135deg, #F2A93E, #F07054)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            SkipQ
          </h2>
        </div>

        <div
          className="bg-white overflow-hidden"
          style={{
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(242, 169, 62, 0.15)',
          }}
        >
          {/* Restaurant Header Banner */}
          <div
            className="px-6 py-8 text-center text-white"
            style={{
              background: 'linear-gradient(135deg, #F2A93E 0%, #F07054 100%)',
            }}
          >
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-3">
              <FiCheckCircle className="w-7 h-7 text-white" />
            </div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Welcome!
            </h1>
            {restaurant && (
              <p className="text-white/90 text-lg font-medium">
                {restaurant.name}
              </p>
            )}
          </div>

          <div className="px-6 py-6">
            {/* Table Info */}
            {tableNumber && (
              <div
                className="flex items-center justify-between p-4 mb-5 rounded-xl"
                style={{ background: '#FFF7ED', border: '1px solid #FDBA74' }}
              >
                <div>
                  <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">
                    Your Table
                  </p>
                  <p
                    className="text-2xl font-bold"
                    style={{ color: '#F07054', fontFamily: 'Poppins, sans-serif' }}
                  >
                    Table {tableNumber}
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #F2A93E, #F07054)' }}
                >
                  <span className="text-white text-xl font-bold">
                    {tableNumber}
                  </span>
                </div>
              </div>
            )}

            {/* Cuisines */}
            {restaurant?.cuisines?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {restaurant.cuisines.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ background: '#FEF3C7', color: '#92400E' }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {/* Status Messages */}
            {redirectState === 'trying_app' && (
              <div
                className="flex items-center space-x-3 p-4 rounded-xl mb-5"
                style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
              >
                <div className="animate-spin">
                  <FiSmartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Opening SkipQ app...
                  </p>
                  <p className="text-xs text-blue-600">
                    If the app doesn't open, you'll see other options below
                  </p>
                </div>
              </div>
            )}

            {redirectState === 'detecting' && !isLoading && (
              <div
                className="flex items-center space-x-3 p-4 rounded-xl mb-5"
                style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
              >
                <div className="animate-pulse">
                  <FiClock className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-blue-800">
                  Preparing your experience...
                </p>
              </div>
            )}

            {/* Action Buttons — shown after app detection attempt */}
            {redirectState === 'show_options' && (
              <div className="space-y-3">
                {/* Primary: Continue to Web Menu */}
                <button
                  onClick={handleContinueWeb}
                  className="w-full py-4 px-4 rounded-xl font-semibold text-white text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2"
                  style={{
                    background: 'linear-gradient(135deg, #F2A93E, #F07054)',
                    boxShadow: '0 4px 15px rgba(240, 112, 84, 0.3)',
                  }}
                >
                  <FiExternalLink className="w-5 h-5" />
                  <span>View Menu & Order</span>
                </button>

                {/* Auto-redirect countdown */}
                {countdown > 0 && (
                  <p className="text-center text-xs text-gray-400">
                    Auto-redirecting in {countdown}s...
                  </p>
                )}

                {/* Mobile-only: Download App or Open App */}
                {platform !== 'desktop' && (
                  <>
                    <div className="relative flex items-center my-2">
                      <div className="flex-grow border-t border-gray-200" />
                      <span className="flex-shrink mx-3 text-xs text-gray-400 uppercase">
                        or
                      </span>
                      <div className="flex-grow border-t border-gray-200" />
                    </div>

                    <button
                      onClick={handleOpenApp}
                      className="w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2"
                      style={{
                        background: '#F0FDF4',
                        color: '#166534',
                        border: '2px solid #BBF7D0',
                      }}
                    >
                      <FiSmartphone className="w-5 h-5" />
                      <span>Open in SkipQ App</span>
                    </button>

                    <button
                      onClick={handleDownloadApp}
                      className="w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2"
                      style={{
                        background: '#EFF6FF',
                        color: '#1E40AF',
                        border: '2px solid #BFDBFE',
                      }}
                    >
                      <FiDownload className="w-5 h-5" />
                      <span>
                        Download SkipQ App
                      </span>
                    </button>

                    {/* Store badges */}
                    <div className="flex items-center justify-center space-x-4 pt-2">
                      {platform === 'ios' && (
                        <a
                          href={deepLinks?.appStore}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          App Store
                        </a>
                      )}
                      {platform === 'android' && (
                        <a
                          href={deepLinks?.playStore}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 hover:text-gray-700 underline"
                        >
                          Google Play
                        </a>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* How it works — desktop only */}
            {platform === 'desktop' && redirectState === 'show_options' && (
              <div
                className="mt-5 p-4 rounded-xl"
                style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
              >
                <p className="text-sm text-amber-800">
                  <strong>Tip:</strong> For the best experience, scan this QR
                  code with your phone's camera to use the SkipQ app!
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 text-center"
            style={{ background: '#FAFAFA', borderTop: '1px solid #F3F4F6' }}
          >
            <p className="text-xs text-gray-400">
              Powered by{' '}
              <span
                className="font-bold"
                style={{ color: '#F2A93E' }}
              >
                SkipQ
              </span>{' '}
              — Skip the queue, not the taste!
            </p>
          </div>
        </div>

        {/* Back to home link */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
