import React, { useEffect, useState, useCallback } from 'react';
import {
  FiPlus,
  FiDownload,
  FiTrash2,
  FiLoader,
  FiAlertCircle,
  FiPrinter,
  FiToggleLeft,
  FiToggleRight,
  FiExternalLink,
  FiRefreshCw,
  FiX,
  FiEdit2,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { qrAPI, restaurantsAPI } from '../../services/api';

export default function QRCodes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState({});
  const [qrCodes, setQrCodes] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);

  // Create QR modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Toggle loading tracker
  const [togglingId, setTogglingId] = useState(null);

  // Restaurant QR (no table)
  const [restaurantQR, setRestaurantQR] = useState(null);
  const [creatingRestaurantQR, setCreatingRestaurantQR] = useState(false);

  const fetchQRCodes = useCallback(async () => {
    try {
      setLoading(true);

      // First get the restaurant for this admin
      const restaurantRes = await restaurantsAPI.getMine();
      const restaurantData =
        restaurantRes.data?.data?.restaurant ||
        restaurantRes.data?.data ||
        restaurantRes.data;
      setRestaurant(restaurantData);
      const restId = restaurantData?._id || restaurantData?.id;
      setRestaurantId(restId);

      if (!restId) {
        toast.error('No restaurant found for your account');
        setLoading(false);
        return;
      }

      // Fetch QR codes
      const qrRes = await qrAPI.getForRestaurant(restId);
      const qrs =
        qrRes.data?.data?.qrCodes || qrRes.data?.data || qrRes.data || [];
      const allQRs = Array.isArray(qrs) ? qrs : [];

      // Separate restaurant-only QR from table QRs
      const restQR = allQRs.find((q) => q.qrType === 'restaurant');
      const tableQRs = allQRs.filter((q) => q.qrType !== 'restaurant');
      setRestaurantQR(restQR || null);
      setQrCodes(tableQRs);
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      toast.error('Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQRCodes();
  }, [fetchQRCodes]);

  // ===== CREATE =====
  const handleCreateQR = async (e) => {
    e.preventDefault();
    if (!newTableNumber.trim()) {
      toast.error('Table number is required');
      return;
    }
    if (!restaurantId) {
      toast.error('Restaurant not found');
      return;
    }

    // Check if table already has QR
    const exists = qrCodes.find(
      (qr) => qr.tableNumber === newTableNumber.trim(),
    );
    if (exists) {
      toast.error(`QR code for Table ${newTableNumber.trim()} already exists`);
      return;
    }

    try {
      setCreateLoading(true);
      await qrAPI.generate({
        restaurantId,
        tableNumber: newTableNumber.trim(),
        type: 'dine_in',
      });
      toast.success(`QR code created for Table ${newTableNumber.trim()}`);
      setShowCreateModal(false);
      setNewTableNumber('');
      fetchQRCodes();
    } catch (error) {
      console.error('Error creating QR code:', error);
      toast.error(
        error.response?.data?.message || 'Failed to create QR code',
      );
    } finally {
      setCreateLoading(false);
    }
  };

  // ===== CREATE RESTAURANT QR (no table) =====
  const handleCreateRestaurantQR = async () => {
    if (!restaurantId) {
      toast.error('Restaurant not found');
      return;
    }
    try {
      setCreatingRestaurantQR(true);
      await qrAPI.generate({
        restaurantId,
        type: 'restaurant',
      });
      toast.success('Restaurant QR code created!');
      fetchQRCodes();
    } catch (error) {
      console.error('Error creating restaurant QR:', error);
      toast.error(
        error.response?.data?.message || 'Failed to create restaurant QR code',
      );
    } finally {
      setCreatingRestaurantQR(false);
    }
  };

  // ===== GENERATE ALL (for tables without QR) =====
  const handleGenerateAll = async () => {
    if (!restaurantId) {
      toast.error('Restaurant not found');
      return;
    }

    try {
      setGenerating((prev) => ({ ...prev, all: true }));

      const tables = restaurant?.tables || [];
      let generated = 0;

      if (tables.length === 0) {
        // If no tables configured, generate for tables 1-4 by default
        for (let i = 1; i <= 4; i++) {
          const exists = qrCodes.find(
            (qr) => qr.tableNumber === String(i),
          );
          if (!exists) {
            try {
              await qrAPI.generate({
                restaurantId,
                tableNumber: String(i),
                type: 'dine_in',
              });
              generated++;
            } catch (err) {
              console.error(`Failed to generate QR for table ${i}:`, err);
            }
          }
        }
      } else {
        for (let table of tables) {
          const exists = qrCodes.find(
            (qr) => qr.tableNumber === table.tableNumber,
          );
          if (!exists) {
            try {
              await qrAPI.generate({
                restaurantId,
                tableNumber: table.tableNumber,
                type: 'dine_in',
              });
              generated++;
            } catch (err) {
              toast.error(
                `Failed to generate QR for table ${table.tableNumber}`,
              );
            }
          }
        }
      }

      if (generated > 0) {
        toast.success(`Generated ${generated} new QR code${generated > 1 ? 's' : ''}`);
      } else {
        toast('All tables already have QR codes', { icon: 'ℹ️' });
      }
      fetchQRCodes();
    } catch (error) {
      console.error('Error generating QR codes:', error);
      toast.error('Failed to generate QR codes');
    } finally {
      setGenerating((prev) => ({ ...prev, all: false }));
    }
  };

  // ===== TOGGLE ACTIVE =====
  const handleToggle = async (qr) => {
    const qrId = qr._id || qr.id;
    try {
      setTogglingId(qrId);
      await qrAPI.toggle(qrId);

      // Update the correct state based on QR type
      if (qr.qrType === 'restaurant') {
        setRestaurantQR((prev) =>
          prev ? { ...prev, isActive: !prev.isActive } : prev,
        );
      } else {
        setQrCodes((prev) =>
          prev.map((q) =>
            (q._id || q.id) === qrId
              ? { ...q, isActive: !q.isActive }
              : q,
          ),
        );
      }

      const label = qr.qrType === 'restaurant' ? 'Restaurant' : `Table ${qr.tableNumber}`;
      toast.success(
        `${label} QR code ${qr.isActive ? 'deactivated' : 'activated'}`,
      );
    } catch (error) {
      console.error('Error toggling QR code:', error);
      toast.error('Failed to update QR code status');
    } finally {
      setTogglingId(null);
    }
  };

  // ===== DELETE =====
  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const qrId = deleteConfirm._id || deleteConfirm.id;

    try {
      setDeleteLoading(true);
      await qrAPI.delete(qrId);

      if (deleteConfirm.qrType === 'restaurant') {
        setRestaurantQR(null);
        toast.success('Restaurant QR code deleted');
      } else {
        setQrCodes((prev) => prev.filter((q) => (q._id || q.id) !== qrId));
        toast.success(`QR code for Table ${deleteConfirm.tableNumber} deleted`);
      }
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting QR code:', error);
      toast.error('Failed to delete QR code');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ===== DOWNLOAD =====
  const handleDownloadQR = (qr) => {
    try {
      if (qr.qrCodeUrl) {
        const link = document.createElement('a');
        link.href = qr.qrCodeUrl;
        link.setAttribute('download', qr.qrType === 'restaurant' ? `${restaurant?.slug || 'restaurant'}-qr.png` : `table-${qr.tableNumber}-qr.png`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Fallback: fetch from API
      qrAPI.download(qr._id || qr.id).then((res) => {
        const url = URL.createObjectURL(res.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', qr.qrType === 'restaurant' ? `${restaurant?.slug || 'restaurant'}-qr.png` : `table-${qr.tableNumber}-qr.png`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleDownloadAll = () => {
    qrCodes.forEach((qr) => handleDownloadQR(qr));
  };

  // ===== PRINT =====
  const handlePrint = (qr) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }
    printWindow.document.write(`
      <html>
        <head><title>QR Code - Table ${qr.tableNumber}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;margin:0;">
          <h2 style="margin-bottom:8px;">${restaurant?.name || 'Restaurant'}</h2>
          <p style="font-size:18px;margin:0 0 16px;">Table ${qr.tableNumber}</p>
          <img src="${qr.qrCodeUrl}" style="width:280px;height:280px;" />
          <p style="margin-top:16px;font-size:14px;color:#666;">Scan to view menu & order</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  const handlePrintAll = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }
    const cards = qrCodes
      .map(
        (qr) => `
        <div style="page-break-inside:avoid;text-align:center;padding:24px;border:1px solid #ddd;border-radius:12px;">
          <h3 style="margin:0 0 4px;">${restaurant?.name || 'Restaurant'}</h3>
          <p style="font-size:16px;margin:0 0 12px;">Table ${qr.tableNumber}</p>
          <img src="${qr.qrCodeUrl}" style="width:200px;height:200px;" />
          <p style="margin-top:8px;font-size:12px;color:#666;">Scan to order</p>
        </div>`,
      )
      .join('');

    printWindow.document.write(`
      <html>
        <head><title>All QR Codes</title></head>
        <body style="font-family:sans-serif;padding:20px;margin:0;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
            ${cards}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => printWindow.print();
  };

  const getScanUrl = (tableNumber) => {
    const baseUrl =
      import.meta.env.VITE_APP_URL || window.location.origin;
    if (tableNumber) {
      return `${baseUrl}/scan/${restaurant?.slug}/${tableNumber}`;
    }
    return `${baseUrl}/scan/${restaurant?.slug}`;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading QR codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 via-white to-orange-50/30 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              QR Code Management
            </h1>
            <p className="text-gray-600 mt-2">
              Generate and manage table QR codes for {restaurant?.name || 'your restaurant'}
            </p>
          </div>
          <button
            onClick={() => {
              setNewTableNumber('');
              setShowCreateModal(true);
            }}
            className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg text-white font-medium py-2 px-6 rounded-[15px] flex items-center space-x-2 transition-all"
          >
            <FiPlus className="w-5 h-5" />
            <span>New QR Code</span>
          </button>
        </div>

        {/* Info Card */}
        <div className="bg-orange-50 border-2 border-dashed border-orange-200 rounded-[15px] p-6 mb-8 shadow-sm">
          <h3 className="font-bold text-primary mb-2">How QR Codes Work</h3>
          <p className="text-gray-700 text-sm mb-4">
            Each table has a unique QR code that customers can scan to view
            your menu and place orders. Generate QR codes for your tables and
            print them to place on the tables.
          </p>
          <div className="text-sm text-gray-700 space-y-1">
            <p>- QR codes include restaurant name and table number</p>
            <p>- Track scan counts for each table</p>
            <p>- Toggle active/inactive to temporarily disable a QR code</p>
            <p>- Download and print QR codes as PNG images</p>
          </div>
        </div>

        {/* ===== RESTAURANT QR CODE (no table) ===== */}
        <div className="bg-white border-2 border-dashed border-blue-200 rounded-[15px] p-6 mb-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-blue-700 text-lg mb-1">
                Restaurant QR Code
              </h3>
              <p className="text-gray-600 text-sm">
                A single QR code for your restaurant — customers scan it to see your menu without a specific table.
                Perfect for takeaway counters, storefronts, or social media.
              </p>
            </div>
            {restaurantQR && restaurantQR.qrCodeUrl && (
              <div className="flex-shrink-0 ml-4">
                <img
                  src={restaurantQR.qrCodeUrl}
                  alt="Restaurant QR"
                  className={`w-28 h-28 rounded-lg border-2 border-blue-100 ${!restaurantQR.isActive ? 'grayscale opacity-60' : ''}`}
                />
              </div>
            )}
          </div>

          {restaurantQR ? (
            <div className="mt-4 space-y-3">
              {/* Status badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    restaurantQR.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {restaurantQR.isActive ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <span className="text-xs text-gray-500">
                  {restaurantQR.scanCount || 0} scan{(restaurantQR.scanCount || 0) !== 1 ? 's' : ''}
                </span>
              </div>

              {/* URL */}
              <div className="flex items-center space-x-2 bg-blue-50/50 border border-blue-100 p-3 rounded-[10px]">
                <input
                  type="text"
                  readOnly
                  value={getScanUrl(null)}
                  className="flex-1 text-xs text-gray-600 bg-white border border-blue-100 rounded-[8px] px-2 py-1 overflow-hidden text-ellipsis"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(getScanUrl(null));
                    toast.success('URL copied!');
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-[8px] transition-colors"
                >
                  <FiExternalLink className="w-4 h-4" />
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleDownloadQR(restaurantQR)}
                  className="flex items-center space-x-1 px-4 py-2 text-blue-700 hover:bg-blue-50 border-2 border-dashed border-blue-200 rounded-[10px] transition-all text-sm"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) { toast.error('Please allow pop-ups to print'); return; }
                    printWindow.document.write(`
                      <html>
                        <head><title>Restaurant QR - ${restaurant?.name || 'Restaurant'}</title></head>
                        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;margin:0;">
                          <h2 style="margin-bottom:8px;">${restaurant?.name || 'Restaurant'}</h2>
                          <p style="font-size:16px;margin:0 0 16px;color:#666;">Scan to view menu & order</p>
                          <img src="${restaurantQR.qrCodeUrl}" style="width:280px;height:280px;" />
                          <p style="margin-top:16px;font-size:14px;color:#999;">Powered by SkipQ</p>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.onload = () => printWindow.print();
                  }}
                  className="flex items-center space-x-1 px-4 py-2 text-blue-700 hover:bg-blue-50 border-2 border-dashed border-blue-200 rounded-[10px] transition-all text-sm"
                >
                  <FiPrinter className="w-4 h-4" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => handleToggle(restaurantQR)}
                  disabled={togglingId === (restaurantQR._id || restaurantQR.id)}
                  className={`flex items-center space-x-1 px-4 py-2 border-2 border-dashed rounded-[10px] transition-all text-sm ${
                    restaurantQR.isActive
                      ? 'text-red-600 border-red-200 hover:bg-red-50'
                      : 'text-green-600 border-green-200 hover:bg-green-50'
                  }`}
                >
                  {togglingId === (restaurantQR._id || restaurantQR.id) ? (
                    <FiLoader className="w-4 h-4 animate-spin" />
                  ) : restaurantQR.isActive ? (
                    <FiToggleRight className="w-4 h-4" />
                  ) : (
                    <FiToggleLeft className="w-4 h-4" />
                  )}
                  <span>{restaurantQR.isActive ? 'Deactivate' : 'Activate'}</span>
                </button>
                <button
                  onClick={() => setDeleteConfirm(restaurantQR)}
                  className="flex items-center space-x-1 px-4 py-2 text-red-500 hover:bg-red-50 border-2 border-dashed border-red-200 rounded-[10px] transition-all text-sm"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleCreateRestaurantQR}
              disabled={creatingRestaurantQR}
              className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg disabled:opacity-50 text-white font-medium py-3 px-6 rounded-[15px] flex items-center space-x-2 transition-all"
            >
              {creatingRestaurantQR ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FiPlus className="w-5 h-5" />
                  <span>Generate Restaurant QR Code</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* ===== TABLE QR CODES SECTION ===== */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Table QR Codes
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <button
            onClick={handleGenerateAll}
            disabled={generating.all}
            className="bg-white border-2 border-dashed border-orange-200 hover:shadow-lg disabled:opacity-50 text-gray-900 font-medium py-3 px-4 rounded-[15px] flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            {generating.all ? (
              <FiLoader className="w-5 h-5 animate-spin" />
            ) : (
              <FiRefreshCw className="w-5 h-5" />
            )}
            <span>Generate Missing QR Codes</span>
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={qrCodes.length === 0}
            className="bg-white border-2 border-dashed border-orange-200 hover:shadow-lg disabled:opacity-50 text-gray-900 font-medium py-3 px-4 rounded-[15px] flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <FiDownload className="w-5 h-5" />
            <span>Download All</span>
          </button>
          <button
            onClick={handlePrintAll}
            disabled={qrCodes.length === 0}
            className="bg-white border-2 border-dashed border-orange-200 hover:shadow-lg disabled:opacity-50 text-gray-900 font-medium py-3 px-4 rounded-[15px] flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <FiPrinter className="w-5 h-5" />
            <span>Print All</span>
          </button>
        </div>

        {/* QR Codes Grid */}
        {qrCodes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-12 text-center">
            <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              No QR codes generated yet
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Create QR codes for your tables to let customers scan and order
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  setNewTableNumber('');
                  setShowCreateModal(true);
                }}
                className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg text-white font-medium py-2 px-6 rounded-[15px] transition-all inline-flex items-center space-x-2"
              >
                <FiPlus className="w-5 h-5" />
                <span>Create QR Code</span>
              </button>
              <button
                onClick={handleGenerateAll}
                disabled={generating.all}
                className="bg-white border-2 border-dashed border-orange-200 hover:shadow-lg disabled:opacity-50 text-gray-900 font-medium py-2 px-6 rounded-[15px] transition-all inline-flex items-center space-x-2"
              >
                {generating.all && <FiLoader className="w-5 h-5 animate-spin" />}
                <span>Generate for All Tables</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map((qr) => {
              const qrId = qr._id || qr.id;
              return (
                <div
                  key={qrId}
                  className={`bg-white border-2 border-dashed rounded-[15px] overflow-hidden hover:shadow-lg transition-all shadow-sm ${
                    qr.isActive ? 'border-orange-200' : 'border-red-200 opacity-70'
                  }`}
                >
                  {/* QR Code Image */}
                  <div className="h-56 bg-orange-50 flex items-center justify-center overflow-hidden p-4 border-b-2 border-dashed border-orange-200 relative">
                    {qr.qrCodeUrl ? (
                      <img
                        src={qr.qrCodeUrl}
                        alt={`Table ${qr.tableNumber}`}
                        className={`max-w-full max-h-full object-contain ${!qr.isActive ? 'grayscale' : ''}`}
                      />
                    ) : (
                      <div className="text-center">
                        <FiAlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No image</p>
                      </div>
                    )}

                    {/* Inactive overlay */}
                    {!qr.isActive && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        INACTIVE
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          Table {qr.tableNumber}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {qr.scanCount || 0} scan{(qr.scanCount || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* Toggle Active */}
                      <button
                        onClick={() => handleToggle(qr)}
                        disabled={togglingId === qrId}
                        className={`p-2 rounded-[10px] transition-all ${
                          qr.isActive
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        }`}
                        title={qr.isActive ? 'Deactivate QR code' : 'Activate QR code'}
                      >
                        {togglingId === qrId ? (
                          <FiLoader className="w-5 h-5 animate-spin" />
                        ) : qr.isActive ? (
                          <FiToggleRight className="w-5 h-5" />
                        ) : (
                          <FiToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Scan URL */}
                    <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-[10px]">
                      <p className="text-xs text-gray-600 font-semibold mb-1">
                        Deep Link
                      </p>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={getScanUrl(qr.tableNumber)}
                          className="flex-1 text-xs text-gray-600 bg-white border-2 border-dashed border-orange-100 rounded-[8px] px-2 py-1 overflow-hidden text-ellipsis"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              getScanUrl(qr.tableNumber),
                            );
                            toast.success('URL copied!');
                          }}
                          className="p-1 text-primary hover:bg-primary/10 rounded-[8px] transition-colors"
                        >
                          <FiExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t-2 border-dashed border-orange-200">
                      <button
                        onClick={() => handleDownloadQR(qr)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-primary hover:bg-orange-50 border-2 border-dashed border-primary rounded-[10px] transition-all text-sm"
                        title="Download"
                      >
                        <FiDownload className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                      <button
                        onClick={() => handlePrint(qr)}
                        className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 text-primary hover:bg-orange-50 border-2 border-dashed border-primary rounded-[10px] transition-all text-sm"
                        title="Print"
                      >
                        <FiPrinter className="w-4 h-4" />
                        <span>Print</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(qr)}
                        className="flex items-center justify-center px-3 py-2 text-red-500 hover:bg-red-50 border-2 border-dashed border-red-300 rounded-[10px] transition-all text-sm"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== CREATE QR MODAL ===== */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-xl w-full max-w-md">
              {/* Header */}
              <div className="border-b-2 border-dashed border-orange-200 p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  Create New QR Code
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-orange-50 rounded-[10px] transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateQR} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Table Number / Name
                  </label>
                  <input
                    type="text"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    placeholder="e.g. 1, 2, VIP-1, Terrace-3"
                    className="w-full px-4 py-3 border-2 border-dashed border-orange-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30 text-lg"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter a table number or name. Each table gets a unique QR code.
                  </p>
                </div>

                {/* Existing QR codes reference */}
                {qrCodes.length > 0 && (
                  <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-[10px]">
                    <p className="text-xs font-semibold text-gray-600 mb-2">
                      Existing tables: {qrCodes.map((q) => q.tableNumber).join(', ')}
                    </p>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 rounded-[10px] transition-colors border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading || !newTableNumber.trim()}
                    className="flex-1 bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg disabled:opacity-50 text-white font-medium py-3 rounded-[10px] transition-all flex items-center justify-center space-x-2"
                  >
                    {createLoading ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <FiPlus className="w-5 h-5" />
                        <span>Create QR Code</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===== DELETE CONFIRMATION ===== */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-xl p-6 max-w-sm w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Delete QR Code?
              </h3>
              <p className="text-gray-600 mb-1">
                {deleteConfirm.qrType === 'restaurant' ? (
                  <span className="font-bold">Restaurant QR Code</span>
                ) : (
                  <>Table <span className="font-bold">{deleteConfirm.tableNumber}</span></>
                )}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This will permanently delete the QR code. Customers will no
                longer be able to scan this code.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleteLoading}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-[10px] transition-colors border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-[10px] transition-colors flex items-center justify-center space-x-2"
                >
                  {deleteLoading ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
