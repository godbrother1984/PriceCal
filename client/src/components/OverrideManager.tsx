// path: client/src/components/OverrideManager.tsx
// version: 5.0 (Change Selling Factor to tubeSize from Product/FG)
// last-modified: 29 ตุลาคม 2568 23:05

import React, { useState, useEffect } from 'react';
import { overrideAPI } from '../services/api';

interface OverrideManagerProps {
  groupId: string;
  type: 'fab-cost' | 'selling-factor' | 'lme-price' | 'exchange-rate' | 'standard-price';
}

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  endpoint?: string;
  displayKey?: string;
  valueKey?: string;
  secondaryKey?: string;
}

interface Override {
  id: string;
  version: number;
  status: 'Draft' | 'Active' | 'Archived';
  effectiveFrom?: Date;
  effectiveTo?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  changeReason?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy?: string;
  [key: string]: any;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  columns: Column[];
  editingItem?: Override | null;
  onApprove?: (item: any) => void;
  onReject?: (item: any) => void;
}

// --- Status Badge Component (same as Master Data) ---
const StatusBadge: React.FC<{ status: 'Active' | 'Draft' | 'Archived' }> = ({ status }) => {
  const normalizedStatus = status === 'Approved' ? 'Active' : status;

  const styles = {
    Active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Draft: 'bg-amber-100 text-amber-800 border-amber-200',
    Archived: 'bg-slate-100 text-slate-600 border-slate-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[normalizedStatus as keyof typeof styles]}`}>
      {normalizedStatus}
    </span>
  );
};

// --- Edit Modal Component (same structure as Master Data) ---
const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  columns,
  editingItem,
  onApprove,
  onReject,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [dropdownData, setDropdownData] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem);
    } else {
      const initialData: any = {};
      columns.forEach(col => {
        if (col.type === 'number') initialData[col.key] = '';
        else initialData[col.key] = '';
      });
      setFormData(initialData);
    }
  }, [editingItem, columns]);

  useEffect(() => {
    // Load dropdown data for select fields
    columns.forEach(async (col) => {
      if (col.endpoint) {
        try {
          const response = await fetch(`http://localhost:3001/api/data/${col.endpoint}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
          const data = await response.json();
          setDropdownData(prev => ({
            ...prev,
            [col.key]: Array.isArray(data) ? data : data.data || []
          }));
        } catch (err) {
          console.error(`Failed to load ${col.endpoint}:`, err);
        }
      }
    });
  }, [columns]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  const isDraft = editingItem?.status === 'Draft';
  const isActive = editingItem?.status === 'Active';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Display status badge if editing */}
            {editingItem && (
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="mt-1"><StatusBadge status={editingItem.status as any} /></div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Version</div>
                  <div className="mt-1 font-semibold">v{editingItem.version}</div>
                </div>
              </div>
            )}

            {columns.map((col) => (
              <div key={col.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {col.label}
                  {col.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {col.endpoint ? (
                  <select
                    value={formData[col.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                    required={col.required}
                    disabled={isActive}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="">-- Select {col.label} --</option>
                    {(dropdownData[col.key] || []).map((option: any) => (
                      <option key={option[col.valueKey!]} value={option[col.valueKey!]}>
                        {option[col.displayKey!]}
                        {col.secondaryKey && ` - ${option[col.secondaryKey]}`}
                      </option>
                    ))}
                  </select>
                ) : col.type === 'number' ? (
                  <input
                    type="number"
                    step="0.000001"
                    value={formData[col.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                    required={col.required}
                    disabled={isActive}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder={`Enter ${col.label}`}
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[col.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                    required={col.required}
                    disabled={isActive}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                    placeholder={`Enter ${col.label}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-gray-200">
            {editingItem && isDraft && onApprove && (
              <button
                type="button"
                onClick={() => onApprove(editingItem)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                ✓ Approve
              </button>
            )}
            {editingItem && isDraft && onReject && (
              <button
                type="button"
                onClick={() => onReject(editingItem)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
              >
                ✗ Reject
              </button>
            )}
            {!isActive && (
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {editingItem ? 'Update' : 'Create'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            >
              {isActive ? 'Close' : 'Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OverrideManager: React.FC<OverrideManagerProps> = ({ groupId, type }) => {
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<Override | null>(null);

  // Get columns definition based on type (same as Master Data)
  const getColumns = (): Column[] => {
    switch (type) {
      case 'fab-cost':
        return [
          { key: 'name', label: 'Name', type: 'text', required: true },
          { key: 'costPerHour', label: 'Cost Per Hour', type: 'number', required: true },
          {
            key: 'currency',
            label: 'Currency',
            type: 'select',
            required: true,
            endpoint: 'currencies',
            displayKey: 'code',
            valueKey: 'code',
            secondaryKey: 'name',
          },
          { key: 'description', label: 'Description', type: 'text', required: false },
          { key: 'changeReason', label: 'Change Reason', type: 'text', required: false }
        ];

      case 'selling-factor':
        return [
          {
            key: 'tubeSize',
            label: 'Tube Size',
            type: 'select',
            required: true,
            endpoint: 'products',
            displayKey: 'tubeSize',
            valueKey: 'tubeSize',
            // ไม่ใส่ secondaryKey เพื่อให้แสดงเฉพาะ tubeSize
          },
          { key: 'factor', label: 'Factor', type: 'number', required: true },
          { key: 'description', label: 'Description', type: 'text', required: false },
          { key: 'changeReason', label: 'Change Reason', type: 'text', required: false }
        ];

      case 'lme-price':
        return [
          {
            key: 'itemGroupCode',
            label: 'Item Group',
            type: 'select',
            required: true,
            endpoint: 'd365-item-groups',
            displayKey: 'code',
            valueKey: 'code',
            secondaryKey: 'name',
          },
          { key: 'price', label: 'Price (THB)', type: 'number', required: true },
          {
            key: 'currency',
            label: 'Currency',
            type: 'select',
            required: true,
            endpoint: 'currencies',
            displayKey: 'code',
            valueKey: 'code',
            secondaryKey: 'name',
          },
          { key: 'description', label: 'Description', type: 'text', required: false },
          { key: 'changeReason', label: 'Change Reason', type: 'text', required: false }
        ];

      case 'exchange-rate':
        return [
          {
            key: 'sourceCurrencyCode',
            label: 'From Currency',
            type: 'select',
            required: true,
            endpoint: 'currencies',
            displayKey: 'code',
            valueKey: 'code',
            secondaryKey: 'name',
          },
          {
            key: 'destinationCurrencyCode',
            label: 'To Currency',
            type: 'select',
            required: true,
            endpoint: 'currencies',
            displayKey: 'code',
            valueKey: 'code',
            secondaryKey: 'name',
          },
          { key: 'rate', label: 'Exchange Rate', type: 'number', required: true },
          { key: 'description', label: 'Description', type: 'text', required: false },
          { key: 'changeReason', label: 'Change Reason', type: 'text', required: false }
        ];

      case 'standard-price':
        return [
          {
            key: 'rawMaterialId',
            label: 'Raw Material',
            type: 'select',
            required: true,
            endpoint: 'raw-materials',
            displayKey: 'id',
            valueKey: 'id',
            secondaryKey: 'name',
          },
          { key: 'price', label: 'Price', type: 'number', required: true },
          {
            key: 'currency',
            label: 'Currency',
            type: 'select',
            required: true,
            endpoint: 'currencies',
            displayKey: 'code',
            valueKey: 'code',
            secondaryKey: 'name',
          },
          { key: 'changeReason', label: 'Change Reason', type: 'text', required: false }
        ];

      default:
        return [];
    }
  };

  const getTypeLabel = () => {
    const labels: Record<string, string> = {
      'fab-cost': 'FAB Cost Override',
      'selling-factor': 'Selling Factor Override',
      'lme-price': 'LME Price Override',
      'exchange-rate': 'Exchange Rate Override',
      'standard-price': 'Standard Price Override',
    };
    return labels[type] || type;
  };

  useEffect(() => {
    loadOverrides();
  }, [groupId, type]);

  const loadOverrides = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await overrideAPI.getAll(groupId, type);
      // Filter: Show only Active and Draft (same as Master Data)
      const filtered = data.filter((item: Override) =>
        item.status === 'Active' || item.status === 'Draft'
      );
      setOverrides(filtered);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setCurrentEditItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: Override) => {
    setCurrentEditItem(item);
    setShowModal(true);
  };

  const handleSave = async (formData: any) => {
    try {
      if (currentEditItem) {
        await overrideAPI.update(groupId, type, currentEditItem.id, formData);
        setSuccessMessage('Override updated successfully');
      } else {
        await overrideAPI.create(groupId, type, { ...formData, createdBy: 'admin' });
        setSuccessMessage('Override created successfully');
      }

      setShowModal(false);
      setCurrentEditItem(null);
      await loadOverrides();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save override');
    }
  };

  const handleApprove = async (item: Override) => {
    if (!confirm('Are you sure you want to approve this override?')) return;

    try {
      await overrideAPI.approve(groupId, type, item.id);
      setSuccessMessage('Override approved successfully');
      setShowModal(false);
      setCurrentEditItem(null);
      await loadOverrides();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve override');
    }
  };

  const handleReject = async (item: Override) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await overrideAPI.delete(groupId, type, item.id);
      setSuccessMessage('Override rejected successfully');
      setShowModal(false);
      setCurrentEditItem(null);
      await loadOverrides();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject override');
    }
  };

  const handleDelete = async (item: Override) => {
    if (!confirm('Are you sure you want to delete this override?')) return;

    try {
      await overrideAPI.delete(groupId, type, item.id);
      setSuccessMessage('Override deleted successfully');
      await loadOverrides();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete override');
    }
  };

  // Get table headers based on type (same as Master Data)
  const getTableHeaders = () => {
    switch (type) {
      case 'fab-cost':
        return ['Version', 'Status', 'Name', 'Cost/Hour', 'Currency', 'Actions'];
      case 'selling-factor':
        return ['Version', 'Status', 'Tube Size', 'Factor', 'Actions'];
      case 'lme-price':
        return ['Version', 'Status', 'Item Group', 'Price', 'Currency', 'Actions'];
      case 'exchange-rate':
        return ['Version', 'Status', 'From Currency', 'To Currency', 'Rate', 'Actions'];
      case 'standard-price':
        return ['Version', 'Status', 'Raw Material', 'Price', 'Currency', 'Actions'];
      default:
        return ['Version', 'Status', 'Data', 'Actions'];
    }
  };

  // Render table cells based on type (same as Master Data)
  const renderTableCells = (override: Override) => {
    switch (type) {
      case 'fab-cost':
        return (
          <>
            <td className="px-4 py-3 text-sm">{override.name}</td>
            <td className="px-4 py-3 text-sm">{override.costPerHour?.toFixed(2)}</td>
            <td className="px-4 py-3 text-sm">{override.currency}</td>
          </>
        );
      case 'selling-factor':
        return (
          <>
            <td className="px-4 py-3 text-sm">{override.tubeSize}</td>
            <td className="px-4 py-3 text-sm">{override.factor?.toFixed(4)}</td>
          </>
        );
      case 'lme-price':
        return (
          <>
            <td className="px-4 py-3 text-sm">{override.itemGroupCode}</td>
            <td className="px-4 py-3 text-sm">{override.price?.toFixed(2)}</td>
            <td className="px-4 py-3 text-sm">{override.currency || 'THB'}</td>
          </>
        );
      case 'exchange-rate':
        return (
          <>
            <td className="px-4 py-3 text-sm">{override.sourceCurrencyCode}</td>
            <td className="px-4 py-3 text-sm">{override.destinationCurrencyCode}</td>
            <td className="px-4 py-3 text-sm">{override.rate?.toFixed(6)}</td>
          </>
        );
      case 'standard-price':
        return (
          <>
            <td className="px-4 py-3 text-sm">{override.rawMaterialId}</td>
            <td className="px-4 py-3 text-sm">{override.price?.toFixed(2)}</td>
            <td className="px-4 py-3 text-sm">{override.currency}</td>
          </>
        );
      default:
        return <td className="px-4 py-3 text-sm">-</td>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{getTypeLabel()}</h3>
          <p className="text-sm text-gray-500 mt-1">
            จัดการราคาพิเศษสำหรับกลุ่มลูกค้านี้ (Override will take priority over Master Data)
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Add Override
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* Override Table (same structure as Master Data) */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {getTableHeaders().map((header, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase ${
                    header === 'Actions' ? 'text-right' : ''
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {overrides.length === 0 ? (
              <tr>
                <td colSpan={getTableHeaders().length} className="px-6 py-12 text-center">
                  <div className="text-gray-500">
                    <div className="text-4xl mb-2">📊</div>
                    <div>ยังไม่มี Override</div>
                    <div className="text-sm mt-2">กดปุ่ม "+ Add Override" เพื่อเพิ่ม Override ใหม่</div>
                  </div>
                </td>
              </tr>
            ) : (
              overrides.map((override) => (
                <tr key={override.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      v{override.version || 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge status={override.status} />
                  </td>
                  {renderTableCells(override)}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {override.status === 'Draft' && (
                        <button
                          onClick={() => handleApprove(override)}
                          className="text-slate-400 hover:text-green-600 transition-colors"
                          title="Approve"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(override)}
                        className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {override.status === 'Draft' && (
                        <button
                          onClick={() => handleDelete(override)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <EditModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setCurrentEditItem(null);
        }}
        onSave={handleSave}
        title={currentEditItem ? `Edit ${getTypeLabel()}` : `Create ${getTypeLabel()}`}
        columns={getColumns()}
        editingItem={currentEditItem}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
};

export default OverrideManager;
