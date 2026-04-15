import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiMapPin, FiClock, FiDollarSign, FiLoader, FiAlertCircle,
  FiNavigation, FiPhone, FiCheckCircle, FiPackage, FiEdit2,
  FiSave, FiX, FiTruck, FiRefreshCw,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { deliveryAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';

/**
 * Mobile-first Delivery Agent Dashboard.
 * - Big online/offline toggle (with location capture)
 * - Editable rate card (base + per-km)
 * - Incoming offers list (Accept / Reject)
 * - Active trip panel (Pickup / Deliver, open maps, call)
 * - Earnings (today / week / lifetime)
 */
export default function DeliveryDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket() || {};

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [offers, setOffers] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, lifetime: 0, deliveriesLifetime: 0 });

  const [onlineBusy, setOnlineBusy] = useState(false);
  const [rateCardEdit, setRateCardEdit] = useState(false);
  const [rateCardDraft, setRateCardDraft] = useState({ baseFare: 30, perKmRate: 8 });
  const [actionBusy, setActionBusy] = useState(false);

  const locationWatchRef = useRef(null);

  // ─────────────── Data fetchers ───────────────
  const fetchAll = useCallback(async () => {
    try {
      const [meRes, offersRes, tripRes] = await Promise.all([
        deliveryAPI.getMe(),
        deliveryAPI.getOffers(),
        deliveryAPI.getActiveTrip(),
      ]);
      const me = meRes.data?.data || meRes.data;
      setProfile(me);
      setRateCardDraft({
        baseFare: me?.rateCard?.baseFare ?? 30,
        perKmRate: me?.rateCard?.perKmRate ?? 8,
      });
      setOffers(offersRes.data?.data || offersRes.data?.offers || []);
      setActiveTrip(tripRes.data?.data || tripRes.data?.order || null);

      // Earnings
      try {
        const eRes = await deliveryAPI.getEarnings({});
        const e = eRes.data?.data || eRes.data || {};
        setEarnings({
          today: (typeof e.today === 'object' ? e.today?.total : e.today) ?? 0,
          week: (typeof e.week === 'object' ? e.week?.total : e.week) ?? 0,
          lifetime: (typeof e.lifetime === 'object' ? e.lifetime?.total : e.lifetime) ?? me?.earningsTotal ?? 0,
          deliveriesLifetime: (typeof e.lifetime === 'object' ? e.lifetime?.count : e.deliveriesLifetime) ?? me?.deliveriesCompleted ?? 0,
        });
      } catch (_) { /* ignore */ }
    } catch (err) {
      console.error('Dashboard load error', err);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ─────────────── Socket listeners ───────────────
  useEffect(() => {
    if (!socket) return;
    const onNewOffer = (offer) => {
      toast.success('New delivery offer available!');
      setOffers((prev) => {
        if (prev.some((o) => String(o.order?._id || o.order) === String(offer.order?._id || offer.order))) return prev;
        return [offer, ...prev];
      });
    };
    const onOfferClosed = ({ orderId }) => {
      setOffers((prev) => prev.filter((o) => String(o.order?._id || o.order) !== String(orderId)));
    };
    socket.on('new_delivery_offer', onNewOffer);
    socket.on('offer_closed', onOfferClosed);
    return () => {
      socket.off('new_delivery_offer', onNewOffer);
      socket.off('offer_closed', onOfferClosed);
    };
  }, [socket]);

  // ─────────────── Location helpers ───────────────
  const getLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('Geolocation not supported'));
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });

  const startLocationWatch = () => {
    if (!navigator.geolocation || locationWatchRef.current) return;
    locationWatchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        deliveryAPI
          .updateAgentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          .catch(() => { /* ignore transient */ });
      },
      () => { /* ignore */ },
      { enableHighAccuracy: true, maximumAge: 15000 }
    );
  };
  const stopLocationWatch = () => {
    if (locationWatchRef.current) {
      navigator.geolocation.clearWatch(locationWatchRef.current);
      locationWatchRef.current = null;
    }
  };
  useEffect(() => () => stopLocationWatch(), []);

  // ─────────────── Actions ───────────────
  const toggleOnline = async () => {
    if (onlineBusy) return;
    const goingOnline = !profile?.isOnline;
    setOnlineBusy(true);
    try {
      let payload = { isOnline: goingOnline };
      if (goingOnline) {
        try {
          const loc = await getLocation();
          payload = { ...payload, lat: loc.lat, lng: loc.lng };
        } catch (e) {
          toast.error('Location permission required to go online');
          setOnlineBusy(false);
          return;
        }
      }
      const res = await deliveryAPI.setOnline(payload);
      const updated = res.data?.data || res.data;
      setProfile((p) => ({ ...p, ...updated }));
      if (goingOnline) startLocationWatch(); else stopLocationWatch();
      toast.success(goingOnline ? 'You are now Online' : 'You are now Offline');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setOnlineBusy(false);
    }
  };

  const saveRateCard = async () => {
    const base = Number(rateCardDraft.baseFare);
    const perKm = Number(rateCardDraft.perKmRate);
    if (!(base >= 0) || !(perKm >= 0)) return toast.error('Rate card values must be non-negative');
    try {
      const res = await deliveryAPI.updateRateCard({ baseFare: base, perKmRate: perKm });
      const updated = res.data?.data || res.data;
      setProfile((p) => ({ ...p, rateCard: updated?.rateCard || { baseFare: base, perKmRate: perKm } }));
      toast.success('Rate card updated');
      setRateCardEdit(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update rate card');
    }
  };

  const acceptOffer = async (orderId) => {
    if (actionBusy) return;
    setActionBusy(true);
    try {
      await deliveryAPI.acceptOffer(orderId);
      toast.success('Order accepted!');
      await fetchAll();
    } catch (err) {
      const status = err?.response?.status;
      toast.error(status === 409 ? 'Another agent already accepted this order' : (err?.response?.data?.message || 'Failed to accept'));
      setOffers((prev) => prev.filter((o) => String(o.order?._id || o.order) !== String(orderId)));
    } finally {
      setActionBusy(false);
    }
  };

  const rejectOffer = async (orderId) => {
    try {
      await deliveryAPI.rejectOffer(orderId);
      setOffers((prev) => prev.filter((o) => String(o.order?._id || o.order) !== String(orderId)));
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  const markPickedUp = async () => {
    if (!activeTrip?._id) return;
    setActionBusy(true);
    try {
      await deliveryAPI.markPickedUp(activeTrip._id);
      toast.success('Order picked up');
      await fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    } finally {
      setActionBusy(false);
    }
  };

  const markDelivered = async () => {
    if (!activeTrip?._id) return;
    setActionBusy(true);
    try {
      await deliveryAPI.markDelivered(activeTrip._id);
      toast.success('Delivery complete! 🎉');
      await fetchAll();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    } finally {
      setActionBusy(false);
    }
  };

  const openMaps = (lat, lng, label) => {
    if (!lat || !lng) return toast.error('Location not available');
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${label ? `&destination_place_id=${encodeURIComponent(label)}` : ''}`;
    window.open(url, '_blank');
  };

  // ─────────────── Render ───────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  // Pending approval gate
  if (profile?.approvalStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-md text-center">
          <FiClock className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Pending Approval</h2>
          <p className="text-gray-600 mt-2 text-sm">
            Your account is awaiting admin approval. You'll be able to receive delivery offers once approved.
          </p>
        </div>
      </div>
    );
  }
  if (profile?.approvalStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-md text-center">
          <FiX className="w-12 h-12 mx-auto text-red-500 mb-3" />
          <h2 className="text-xl font-bold text-gray-900">Application Rejected</h2>
          {profile?.approvalNote && <p className="text-gray-600 mt-2 text-sm">{profile.approvalNote}</p>}
        </div>
      </div>
    );
  }

  const isOnline = !!profile?.isOnline;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 pb-24">
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hi, {user?.name?.split(' ')[0] || 'Rider'}</h1>
            <p className="text-xs text-gray-600">{isOnline ? 'Ready for deliveries' : 'Go online to receive offers'}</p>
          </div>
          <button onClick={fetchAll} className="p-2 text-gray-500 hover:text-primary" aria-label="Refresh">
            <FiRefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Online toggle */}
        <button
          onClick={toggleOnline}
          disabled={onlineBusy}
          className={`w-full rounded-2xl p-5 shadow-sm transition text-white font-bold text-lg flex items-center justify-between ${
            isOnline ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-gray-400 to-gray-500'
          } ${onlineBusy ? 'opacity-70' : ''}`}
        >
          <span className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-200'}`} />
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </span>
          <span className="text-sm font-medium opacity-90">{isOnline ? 'Tap to go offline' : 'Tap to go online'}</span>
        </button>

        {/* Earnings strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Today', value: earnings.today },
            { label: 'Week', value: earnings.week },
            { label: 'Lifetime', value: earnings.lifetime },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl shadow-sm p-3 text-center">
              <p className="text-[11px] text-gray-500">{s.label}</p>
              <p className="text-base font-bold text-gray-900">₹{Number(s.value || 0).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Active trip */}
        {activeTrip && (
          <div className="bg-white rounded-2xl shadow-sm p-4 border-l-4 border-primary">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-gray-900 flex items-center gap-2"><FiTruck /> Active Trip</h2>
              <span className="text-xs font-semibold text-primary uppercase">{activeTrip.status?.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-sm text-gray-600">Order #{activeTrip.orderNumber}</p>

            <div className="mt-3 space-y-2 text-sm">
              <div>
                <p className="text-xs text-gray-500">Pickup</p>
                <p className="font-medium text-gray-900">{activeTrip.restaurant?.name || 'Restaurant'}</p>
                <p className="text-xs text-gray-600">{activeTrip.restaurant?.address?.street || ''}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Drop</p>
                <p className="font-medium text-gray-900">{activeTrip.customer?.name || 'Customer'}</p>
                <p className="text-xs text-gray-600">{activeTrip.deliveryAddress?.address || ''}</p>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t">
                <span className="text-gray-500">Your payout</span>
                <span className="font-bold text-emerald-600">₹{Number(activeTrip.deliveryAgentPayout || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {!activeTrip.pickedUpAt ? (
                <button onClick={markPickedUp} disabled={actionBusy} className="col-span-2 bg-primary text-white rounded-lg py-3 font-semibold flex items-center justify-center gap-2">
                  <FiPackage /> Mark Picked Up
                </button>
              ) : (
                <button onClick={markDelivered} disabled={actionBusy} className="col-span-2 bg-emerald-600 text-white rounded-lg py-3 font-semibold flex items-center justify-center gap-2">
                  <FiCheckCircle /> Mark Delivered
                </button>
              )}
              <button
                onClick={() => openMaps(activeTrip.restaurant?.location?.coordinates?.[1] || activeTrip.restaurant?.lat, activeTrip.restaurant?.location?.coordinates?.[0] || activeTrip.restaurant?.lng, 'Pickup')}
                className="bg-blue-50 text-blue-700 rounded-lg py-2 font-medium flex items-center justify-center gap-1 text-sm"
              >
                <FiNavigation /> To Pickup
              </button>
              <button
                onClick={() => openMaps(activeTrip.deliveryAddress?.lat, activeTrip.deliveryAddress?.lng, 'Drop')}
                className="bg-blue-50 text-blue-700 rounded-lg py-2 font-medium flex items-center justify-center gap-1 text-sm"
              >
                <FiNavigation /> To Drop
              </button>
              {activeTrip.customer?.phone && (
                <a href={`tel:${activeTrip.customer.phone}`} className="col-span-2 bg-gray-100 text-gray-700 rounded-lg py-2 font-medium flex items-center justify-center gap-2 text-sm">
                  <FiPhone /> Call Customer
                </a>
              )}
            </div>
          </div>
        )}

        {/* Incoming offers */}
        {!activeTrip && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-bold text-gray-900 mb-2">Incoming Offers</h2>
            {offers.length === 0 ? (
              <div className="py-8 text-center text-gray-500">
                <FiAlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">{isOnline ? 'No offers yet. Stay online — we\'ll notify you.' : 'Go online to start receiving offers.'}</p>
              </div>
            ) : (
              <ul className="divide-y">
                {offers.map((o) => {
                  const order = o.order || {};
                  const orderId = order._id || o.order;
                  return (
                    <li key={orderId} className="py-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{order.restaurant?.name || 'Restaurant'}</p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            <FiMapPin className="inline w-3 h-3 mr-1" />
                            {Number(o.distanceKm || 0).toFixed(1)} km to pickup · trip {Number(o.tripDistanceKm || 0).toFixed(1)} km
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-emerald-600 font-bold">₹{Number(o.quotedPrice || 0).toFixed(2)}</p>
                          <p className="text-[10px] text-gray-500">your payout</p>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => rejectOffer(orderId)}
                          className="bg-gray-100 text-gray-700 rounded-lg py-2 text-sm font-medium"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => acceptOffer(orderId)}
                          disabled={actionBusy}
                          className="bg-emerald-600 text-white rounded-lg py-2 text-sm font-semibold"
                        >
                          Accept
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* Rate card */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><FiDollarSign /> Your Rate Card</h2>
            {!rateCardEdit ? (
              <button onClick={() => setRateCardEdit(true)} className="text-primary text-sm flex items-center gap-1">
                <FiEdit2 /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => { setRateCardEdit(false); setRateCardDraft({ baseFare: profile?.rateCard?.baseFare ?? 30, perKmRate: profile?.rateCard?.perKmRate ?? 8 }); }} className="text-gray-500 text-sm flex items-center gap-1"><FiX /> Cancel</button>
                <button onClick={saveRateCard} className="text-emerald-600 text-sm flex items-center gap-1 font-semibold"><FiSave /> Save</button>
              </div>
            )}
          </div>
          {!rateCardEdit ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Base fare</p>
                <p className="font-bold text-gray-900">₹{Number(profile?.rateCard?.baseFare ?? 30).toFixed(2)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-gray-500 text-xs">Per km</p>
                <p className="font-bold text-gray-900">₹{Number(profile?.rateCard?.perKmRate ?? 8).toFixed(2)}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="block">
                <span className="text-gray-500 text-xs">Base fare (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={rateCardDraft.baseFare}
                  onChange={(e) => setRateCardDraft((d) => ({ ...d, baseFare: e.target.value }))}
                  className="w-full mt-1 rounded-lg border-gray-300 p-2 border"
                />
              </label>
              <label className="block">
                <span className="text-gray-500 text-xs">Per km (₹)</span>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={rateCardDraft.perKmRate}
                  onChange={(e) => setRateCardDraft((d) => ({ ...d, perKmRate: e.target.value }))}
                  className="w-full mt-1 rounded-lg border-gray-300 p-2 border"
                />
              </label>
              <p className="col-span-2 text-[11px] text-gray-500">
                Payout = base + per km × trip distance. Offers show your computed payout before accepting.
              </p>
            </div>
          )}
        </div>

        {/* Stats footer */}
        <div className="text-center text-xs text-gray-500 pt-2">
          {earnings.deliveriesLifetime} deliveries completed
        </div>
      </div>
    </div>
  );
}
