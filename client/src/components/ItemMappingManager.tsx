// path: client/src/components/ItemMappingManager.tsx
// version: 1.0 (Manual Mapping UI for Dummy Items → D365)
// last-modified: 21 ตุลาคม 2568 14:45

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import ItemStatusBadge from './ItemStatusBadge';

// Interfaces
interface PendingMappingItem {
  id: string; // Dummy Item ID (FG-DUMMY-001)
  name: string; // ชื่อ Dummy Item
  itemStatus: string; // 'IN_USE' | 'AVAILABLE'
  linkedRequestId: string; // Price Request ID ที่เกี่ยวข้อง
  customerPO?: string; // Customer PO Number
  awaitingD365Creation: boolean; // รอสร้าง Item ใน D365 หรือไม่
  createdAt: string; // วันที่สร้าง Dummy Item
}

interface MappingFormData {
  dummyItemId: string; // Dummy Item ID ที่จะ map
  d365ItemId: string; // D365 Item ID (ผู้ใช้กรอก)
  customerPO: string; // Customer PO (optional)
  notes: string; // หมายเหตุ (optional)
}

const ItemMappingManager: React.FC = () => {
  // State Management
  const [pendingItems, setPendingItems] = useState<PendingMappingItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<PendingMappingItem | null>(null);
  const [formData, setFormData] = useState<MappingFormData>({
    dummyItemId: '',
    d365ItemId: '',
    customerPO: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load pending mappings on mount
  useEffect(() => {
    loadPendingMappings();
  }, []);

  // Functions
  const loadPendingMappings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/dummy-items/pending-mappings');
      if (response.data.success) {
        setPendingItems(response.data.data || []);
      } else {
        setError('Failed to load pending mappings');
      }
    } catch (err) {
      console.error('Error loading pending mappings:', err);
      setError('ไม่สามารถโหลดรายการรอ Mapping ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item: PendingMappingItem) => {
    setSelectedItem(item);
    setFormData({
      dummyItemId: item.id,
      d365ItemId: '',
      customerPO: item.customerPO || '',
      notes: ''
    });
    setError(null);
    setSuccessMessage(null);
  };

  const handleInputChange = (field: keyof MappingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitMapping = async () => {
    // Validation
    if (!formData.d365ItemId || formData.d365ItemId.trim() === '') {
      setError('กรุณากรอก D365 Item ID');
      return;
    }

    if (!selectedItem) {
      setError('กรุณาเลือก Dummy Item ที่ต้องการ map');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/dummy-items/map-to-d365', {
        dummyItemId: selectedItem.id,
        d365ItemId: formData.d365ItemId.trim(),
        customerPO: formData.customerPO || selectedItem.customerPO,
        notes: formData.notes
      });

      if (response.data.success) {
        setSuccessMessage(
          `✅ Mapped ${selectedItem.id} → ${formData.d365ItemId} successfully!`
        );

        // Reload pending mappings
        await loadPendingMappings();

        // Clear form
        handleClear();

        // Auto-dismiss success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(response.data.message || 'Mapping failed');
      }
    } catch (err: any) {
      console.error('Error submitting mapping:', err);
      setError(err.response?.data?.message || 'ไม่สามารถทำ Mapping ได้');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedItem(null);
    setFormData({
      dummyItemId: '',
      d365ItemId: '',
      customerPO: '',
      notes: ''
    });
    setError(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">🔗 Item Mapping (Dummy → D365)</h3>
        <p className="text-sm text-slate-600">
          Manual Mapping: เชื่อมโยง Dummy Item กับ D365 Item ที่ Production สร้างแล้ว
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-3 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-green-800 flex-1">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 hover:text-green-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Pending Mappings Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-slate-200">
            <h4 className="font-semibold">Pending Mappings</h4>
            <p className="text-xs text-slate-500 mt-1">
              รายการ Dummy Items ที่รอ mapping กับ D365
            </p>
          </div>

          <div className="overflow-x-auto">
            {loading && pendingItems.length === 0 ? (
              <div className="p-12 text-center">
                <svg
                  className="animate-spin h-8 w-8 mx-auto text-blue-600"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <p className="mt-4 text-slate-600">Loading pending mappings...</p>
              </div>
            ) : pendingItems.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-300 rounded-lg m-4">
                <svg
                  className="mx-auto h-12 w-12 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-slate-900">
                  No Pending Mappings
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  ไม่มี Dummy Items ที่รอ mapping ในขณะนี้
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                      Dummy Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                      Request ID
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-700 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {pendingItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 ${
                        selectedItem?.id === item.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-slate-900">{item.id}</div>
                        <div className="text-xs text-slate-500">{item.name}</div>
                        {item.customerPO && (
                          <div className="text-xs text-slate-500 mt-1">
                            PO: {item.customerPO}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <ItemStatusBadge status={item.itemStatus} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.linkedRequestId || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleSelectItem(item)}
                          className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Side: Mapping Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-slate-200">
            <h4 className="font-semibold">Mapping Form</h4>
            <p className="text-xs text-slate-500 mt-1">
              {selectedItem
                ? `Mapping: ${selectedItem.id} → D365 Item`
                : 'เลือก Dummy Item จากตารางด้านซ้าย'}
            </p>
          </div>

          {!selectedItem ? (
            <div className="p-12 text-center text-slate-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <p className="text-lg font-medium mb-2">No Item Selected</p>
              <p className="text-sm">เลือก Dummy Item จากตารางด้านซ้ายเพื่อเริ่ม mapping</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Dummy Item Details (Read-only) */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <h5 className="text-sm font-semibold text-slate-700 mb-3">
                  Dummy Item Details
                </h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">ID:</span>{' '}
                    <span className="font-medium">{selectedItem.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Name:</span>{' '}
                    <span className="font-medium">{selectedItem.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Request ID:</span>{' '}
                    <span className="font-medium">{selectedItem.linkedRequestId || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Customer PO:</span>{' '}
                    <span className="font-medium">{selectedItem.customerPO || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Created:</span>{' '}
                    <span className="font-medium">{formatDate(selectedItem.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>{' '}
                    <ItemStatusBadge status={selectedItem.itemStatus} size="sm" />
                  </div>
                </div>
              </div>

              {/* D365 Item ID (Required) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  D365 Item ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.d365ItemId}
                  onChange={(e) => handleInputChange('d365ItemId', e.target.value)}
                  placeholder="D365-FG-XXXX"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
                <p className="mt-1 text-xs text-slate-500">
                  กรอก D365 Item ID ที่ Production สร้างแล้ว (ตัวอย่าง: D365-FG-5001)
                </p>
              </div>

              {/* Customer PO (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Customer PO (Optional)
                </label>
                <input
                  type="text"
                  value={formData.customerPO}
                  onChange={(e) => handleInputChange('customerPO', e.target.value)}
                  placeholder="PO-2025-001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>

              {/* Notes (Optional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="หมายเหตุเพิ่มเติม..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleClear}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear
                </button>
                <button
                  onClick={handleSubmitMapping}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Mapping...
                    </>
                  ) : (
                    'Map to D365'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemMappingManager;
