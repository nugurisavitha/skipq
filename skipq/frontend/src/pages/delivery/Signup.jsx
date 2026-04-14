import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTruck, FiCheckCircle, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { deliveryAPI } from '../../services/api';

export default function DeliverySignup() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    vehicleType: 'bike', vehicleNumber: '',
    baseFare: 30, perKmRate: 8,
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      return toast.error('Please fill all required fields');
    }
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setBusy(true);
    try {
      await deliveryAPI.signup({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        vehicleType: form.vehicleType,
        vehicleNumber: form.vehicleNumber,
        rateCard: { baseFare: Number(form.baseFare), perKmRate: Number(form.perKmRate) },
      });
      setSubmitted(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Signup failed');
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-md p-6 max-w-md text-center">
          <FiCheckCircle className="w-14 h-14 mx-auto text-emerald-500 mb-3" />
          <h2 className="text-xl font-bold">Application submitted</h2>
          <p className="text-gray-600 text-sm mt-2">
            Thanks for signing up! An admin will review your profile and approve your account.
            You'll be able to log in once approved.
          </p>
          <button onClick={() => navigate('/login')} className="mt-4 bg-primary text-white rounded-lg py-2 px-4 font-semibold">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <FiTruck className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Become a Delivery Partner</h1>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input value={form.name} onChange={set('name')} placeholder="Full name *" className="w-full p-2 border rounded-lg" />
          <input type="email" value={form.email} onChange={set('email')} placeholder="Email *" className="w-full p-2 border rounded-lg" />
          <input value={form.phone} onChange={set('phone')} placeholder="Phone *" className="w-full p-2 border rounded-lg" />
          <input type="password" value={form.password} onChange={set('password')} placeholder="Password (min 6 chars) *" className="w-full p-2 border rounded-lg" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.vehicleType} onChange={set('vehicleType')} className="p-2 border rounded-lg">
              <option value="bike">Bike</option>
              <option value="scooter">Scooter</option>
              <option value="bicycle">Bicycle</option>
              <option value="car">Car</option>
              <option value="other">Other</option>
            </select>
            <input value={form.vehicleNumber} onChange={set('vehicleNumber')} placeholder="Vehicle no." className="p-2 border rounded-lg" />
          </div>
          <div className="bg-orange-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-2">Your rate card (you can edit later)</p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-gray-500">Base fare (₹)
                <input type="number" min="0" step="0.5" value={form.baseFare} onChange={set('baseFare')} className="w-full p-2 border rounded-lg mt-1" />
              </label>
              <label className="text-xs text-gray-500">Per km (₹)
                <input type="number" min="0" step="0.5" value={form.perKmRate} onChange={set('perKmRate')} className="w-full p-2 border rounded-lg mt-1" />
              </label>
            </div>
          </div>
          <button disabled={busy} type="submit" className="w-full bg-primary text-white rounded-lg py-2 font-semibold flex items-center justify-center gap-2">
            {busy ? <FiLoader className="animate-spin" /> : null} Submit Application
          </button>
          <p className="text-center text-xs text-gray-500">
            Already approved? <Link to="/login" className="text-primary font-semibold">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
