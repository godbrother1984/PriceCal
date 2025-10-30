// path: client/src/pages/MasterData.tsx
// version: 10.3 (Change FAB Cost from name to itemGroup)
// last-modified: 30 ตุลาคม 2568 17:50

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api'; // ✅ ใช้ centralized api instance ที่มี JWT interceptor
import ActivityLogs from '../components/ActivityLogs';
import ImportManager from '../components/ImportManager';
import MasterDataViewer from '../components/MasterDataViewer';
import BOQViewer from '../components/BOQViewer';
import BOQEditor from '../components/BOQEditor';
import ItemMappingManager from '../components/ItemMappingManager';
import VersionHistoryModal, { MasterDataType } from '../components/VersionHistoryModal';

// --- Unified Status Badge Component ---
interface StatusBadgeProps {
  status: 'Active' | 'Draft' | 'Archived' | 'Approved';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  // Normalize 'Approved' to 'Active' for consistency
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

// --- Types ---
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


interface MasterItem {
  [key: string]: any;
}

interface MasterDataTableProps {
  title: string;
  endpoint: string;
  columns: Column[];
  editingItem?: MasterItem | null;
  openItemId?: string;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  columns: Column[];
  editingItem?: MasterItem | null;
  onApprove?: (item: any) => void;
  onReject?: (item: any) => void;
}

// --- Loading Component ---
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = "Loading..." }) => (
  <div className="flex flex-col justify-center items-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
    <p className="text-slate-600 text-sm">{message}</p>
  </div>
);

// --- Success Message Component ---
const SuccessMessage: React.FC<{ message: string; onDismiss?: () => void }> = ({ 
  message, 
  onDismiss 
}) => (
  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3 flex-1">
        <p className="text-sm font-medium text-green-800">{message}</p>
      </div>
      {onDismiss && (
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={onDismiss}
            className="text-green-400 hover:text-green-600"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  </div>
);

// --- Enhanced Searchable Select Component ---
const SearchableSelect: React.FC<{
  endpoint: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  displayKey?: string;
  valueKey?: string;
  secondaryKey?: string;
  disabled?: boolean;
}> = ({
  endpoint,
  value,
  onChange,
  placeholder = 'Type to search...',
  displayKey = 'name',
  valueKey = 'id',
  secondaryKey,
  disabled = false,
}) => {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number; position: 'up' | 'down' }>({
    top: 0,
    left: 0,
    width: 0,
    position: 'down'
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const getOptionValue = useCallback(
    (option: any): string => {
      if (!option) return '';
      if (
        valueKey &&
        Object.prototype.hasOwnProperty.call(option, valueKey) &&
        option[valueKey] !== undefined &&
        option[valueKey] !== null
      ) {
        return String(option[valueKey]);
      }
      return String(option.id ?? '');
    },
    [valueKey],
  );

const buildOptionLabel = useCallback(
  (option: any): string => {
    if (!option) return '';
    const optionValue = getOptionValue(option);
    const label =
      secondaryKey !== undefined && secondaryKey !== null
        ? option?.[secondaryKey]
        : option?.[displayKey];
    const labelText = label !== undefined && label !== null ? String(label) : '';

    if (labelText && labelText !== optionValue) {
      return `${optionValue} - ${labelText}`;
    }

    return optionValue || labelText;
  },
  [displayKey, secondaryKey, getOptionValue],
  );

  // Load options
  const loadOptions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/data/${endpoint}`);
      let data = Array.isArray(response.data) ? response.data : [];

      // ✅ ถ้าเป็น products และใช้ tubeSize → กรองและสร้าง unique list
      if (endpoint === 'products' && valueKey === 'tubeSize') {
        // กรองเฉพาะที่มี tubeSize
        const withTubeSize = data.filter(item => item.tubeSize && item.tubeSize.trim() !== '');
        // สร้าง unique tubeSize list
        const uniqueTubeSizes = [...new Set(withTubeSize.map(item => item.tubeSize))];
        // แปลงเป็น object format
        data = uniqueTubeSizes.map(size => ({ tubeSize: size }));
      }

      setOptions(data);
    } catch (error) {
      console.error(`Error loading ${endpoint}:`, error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, valueKey]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  // Update input value when value prop changes
  useEffect(() => {
    if (value && options.length > 0) {
      const selected = options.find(
        (opt) => getOptionValue(opt) === value || String(opt.id ?? '') === value,
      );
      setInputValue(selected ? getOptionValue(selected) : value);
      setSearchTerm('');
    } else if (!value) {
      setInputValue('');
      setSearchTerm('');
    }
  }, [value, options, buildOptionLabel, getOptionValue]);

  // Update search term when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setSearchTerm(newValue);
    
    if (!isOpen && newValue.length > 0) {
      handleFocus();
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (disabled) return;
    
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      const shouldShowUp = spaceBelow < 240 && spaceAbove > 240;
      
      setDropdownPosition({
        top: shouldShowUp ? rect.top - 240 : rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        position: shouldShowUp ? 'up' : 'down'
      });
    }
    
    setIsOpen(true);
  };

  // Handle option selection
  const handleSelect = (option: any) => {
    const optionValue = getOptionValue(option);
    onChange(optionValue);
    setInputValue(optionValue);
    setSearchTerm('');
    setIsOpen(false);
  };

  // Handle input blur (with delay to allow option click)
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      // Reset to selected value if no valid selection was made
      if (value && options.length > 0) {
        const selected = options.find(
          (opt) => getOptionValue(opt) === value || String(opt.id ?? '') === value,
        );
        setInputValue(selected ? getOptionValue(selected) : '');
      } else if (!value) {
        setInputValue('');
      }
      setSearchTerm('');
    }, 150);
  };

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setInputValue('');
    setSearchTerm('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Filter options based on search term
  const filteredOptions =
    searchTerm.length > 0
      ? options.filter((option) => {
          const optionValue = getOptionValue(option);
          const searchLower = searchTerm.toLowerCase();
          return (
            optionValue.toLowerCase().includes(searchLower) ||
            String(option.id ?? '').toLowerCase().includes(searchLower) ||
            String(option[displayKey] ?? '').toLowerCase().includes(searchLower) ||
            (secondaryKey ? String(option[secondaryKey] ?? '').toLowerCase().includes(searchLower) : false)
          );
        })
      : options;

  if (loading) {
    return (
      <div className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50">
        <span className="text-slate-500 text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-8 border rounded-lg transition-colors ${
            disabled 
              ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-white border-slate-300 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }`}
        />
        
        {/* Clear button */}
        {inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-7 flex items-center text-slate-400 hover:text-slate-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Dropdown arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Portal dropdown outside the modal */}
      {isOpen && !disabled && filteredOptions.length > 0 && createPortal(
        <div 
          className="fixed bg-white border border-slate-300 rounded-lg shadow-lg z-[9999] overflow-hidden"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            maxHeight: '200px'
          }}
        >
          <div className="max-h-48 overflow-y-auto scrollbar-dropdown">
            {filteredOptions.map(option => (
              <button
                key={String(option.id ?? getOptionValue(option))}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(option)}
                className={`w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 ${
                  value === getOptionValue(option) ? 'bg-blue-50 text-blue-600' : 'text-slate-900'
                }`}
              >
                <div className="font-medium">{buildOptionLabel(option)}</div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

// --- Edit Modal Component ---
const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  columns,
  editingItem,
  onApprove,
  onReject
}) => {
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        // แปลง boolean values เป็น string สำหรับ select dropdowns
        const formattedData = { ...editingItem };
        columns.forEach(col => {
          if (col.options && typeof formattedData[col.key] === 'boolean') {
            formattedData[col.key] = formattedData[col.key].toString();
          }
        });
        setFormData(formattedData);
      } else {
        const initialData: any = {};
        columns.forEach(col => {
          initialData[col.key] = '';
        });
        setFormData(initialData);
      }
      setErrors({});
    }
  }, [isOpen, editingItem, columns]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: any = {};
    columns.forEach(column => {
      if (column.required && (!formData[column.key] || formData[column.key].toString().trim() === '')) {
        newErrors[column.key] = `${column.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[85vh] flex flex-col">
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <form onSubmit={handleSubmit} className="space-y-4 pb-6" id="master-data-form">
            {columns.map(column => (
              <div key={column.key}>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {column.label}
                  {column.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {column.endpoint ? (
                <SearchableSelect
                  endpoint={column.endpoint}
                  value={formData[column.key] || ''}
                  onChange={(value) => setFormData((prev: any) => ({ ...prev, [column.key]: value }))}
                  placeholder={`Select ${column.label}`}
                  displayKey={column.displayKey || 'name'}
                  valueKey={column.valueKey}
                />
                ) : column.options ? (
                  <select
                    value={formData[column.key] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [column.key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select {column.label}</option>
                    {column.options.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={column.type || 'text'}
                    value={formData[column.key] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ 
                      ...prev, 
                      [column.key]: column.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Enter ${column.label}`}
                  />
                )}

                {errors[column.key] && (
                  <p className="text-sm text-red-600 mt-1">{errors[column.key]}</p>
                )}
              </div>
            ))}
          </form>
        </div>

        <div className="p-6 border-t border-slate-200 flex-shrink-0">
          {/* Approval Actions - Show only for Draft items */}
          {editingItem && editingItem.status === 'Draft' && (onApprove || onReject) && (
            <div className="flex gap-3 mb-4 pb-4 border-b border-slate-200">
              {onApprove && (
                <button
                  type="button"
                  onClick={() => onApprove(editingItem)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  ✓ อนุมัติ (Approve)
                </button>
              )}
              {onReject && (
                <button
                  type="button"
                  onClick={() => onReject(editingItem)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  ✕ ปฏิเสธ (Reject)
                </button>
              )}
            </div>
          )}

          {/* Standard Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              ปิด (Close)
            </button>
            <button
              type="submit"
              form="master-data-form"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              บันทึก (Save)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Master Data Table Component ---
const MasterDataTable: React.FC<MasterDataTableProps> = ({
  title,
  endpoint,
  columns,
  editingItem,
  openItemId
}) => {
  const [data, setData] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<MasterItem | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/data/${endpoint}`);
      setData(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(`Failed to load ${title.toLowerCase()}`);
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  }, [endpoint, title]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (editingItem) {
      setCurrentEditItem(editingItem);
      setShowModal(true);
    }
  }, [editingItem]);

  // Handle programmatic modal opening from Dashboard navigation
  useEffect(() => {
    if (openItemId && data.length > 0) {
      const itemToOpen = data.find(item => item.id === openItemId);
      if (itemToOpen) {
        console.log('Opening modal for item:', itemToOpen);
        setCurrentEditItem(itemToOpen);
        setShowModal(true);
      } else {
        console.warn('Item not found for openItemId:', openItemId);
      }
    }
  }, [openItemId, data]);

  const handleAdd = () => {
    setCurrentEditItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: MasterItem) => {
    setCurrentEditItem(item);
    setShowModal(true);
  };

  const handleSave = async (formData: any) => {
    try {
      if (currentEditItem) {
        await api.put(`/api/data/${endpoint}/${currentEditItem.id}`, formData);
        setSuccessMessage(`${title.slice(0, -1)} updated successfully`);
      } else {
        await api.post(`/api/data/${endpoint}`, formData);
        setSuccessMessage(`${title.slice(0, -1)} created successfully`);
      }
      
      setShowModal(false);
      setCurrentEditItem(null);
      loadData();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || `Failed to save ${title.toLowerCase()}`);
    }
  };

  const handleDelete = async (item: MasterItem) => {
    if (!confirm(`Are you sure you want to delete this ${title.slice(0, -1).toLowerCase()}?`)) {
      return;
    }

    try {
      await api.delete(`/api/data/${endpoint}/${item.id}`);
      setSuccessMessage(`${title.slice(0, -1)} deleted successfully`);
      loadData();
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || `Failed to delete ${title.toLowerCase()}`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentEditItem(null);
  };

  if (loading) return <LoadingSpinner message={`Loading ${title.toLowerCase()}...`} />;

  return (
    <div className="space-y-6">
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {data.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No {title.toLowerCase()} found</h3>
            <p className="text-slate-500 mb-4">Get started by adding your first {title.slice(0, -1).toLowerCase()}.</p>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add {title.slice(0, -1)}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    ID
                  </th>
                  {columns.map(column => (
                    <th key={column.key} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-xs text-slate-600 font-mono" title={item.id}>
                      {item.id ? item.id.substring(0, 8) + '...' : 'N/A'}
                    </td>
                    {columns.map(column => (
                      <td key={column.key} className="px-4 py-3 text-sm text-slate-900">
                        {(() => {
                          // Handle currency fields
                          if (column.key === 'currency' || column.key.includes('Currency')) {
                            const codeValue = item[column.key];
                            return codeValue || 'N/A';
                          }

                          // Handle relation fields (e.g., customerId with customer relation)
                          if (column.key.endsWith('Id') && column.displayKey) {
                            const relationName = column.key.replace('Id', '');
                            const relationObj = item[relationName];

                            if (relationObj) {
                              const idValue = item[column.key];
                              const displayValue = relationObj[column.displayKey];

                              return (
                                <div>
                                  <div className="font-medium text-slate-900">{idValue}</div>
                                  {displayValue && (
                                    <div className="text-xs text-slate-500">{displayValue}</div>
                                  )}
                                </div>
                              );
                            }
                          }

                          if (column.key.includes('Name') && column.key !== 'name') {
                            return item[column.key] || item[column.key.replace('Name', '')] || 'N/A';
                          }
                          if (column.key === 'isActive') {
                            return item[column.key] ? 'Active' : 'Inactive';
                          }
                          if (column.key === 'isDefault') {
                            const isDefault = item[column.key] === true || item[column.key] === 'true';
                            return isDefault ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                                Yes
                              </span>
                            ) : 'No';
                          }
                          const value = item[column.key];
                          if (value === null || value === undefined || value === '') {
                            return 'N/A';
                          }
                          return value;
                        })()}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="text-slate-400 hover:text-red-600 transition-colors ml-2"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EditModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        title={`${currentEditItem ? 'Edit' : 'Add'} ${title.slice(0, -1)}`}
        columns={columns}
        editingItem={currentEditItem}
      />
    </div>
  );
};

// --- Customer Mapping Table (Special handling) ---
const CustomerMappingTable: React.FC = () => {
  const mappingColumns: Column[] = [
    { 
      key: 'customerId', 
      label: 'Customer', 
      required: true,
      endpoint: 'customers',
      displayKey: 'name'
    },
    { 
      key: 'customerGroupId', 
      label: 'Customer Group', 
      required: true,
      endpoint: 'customer-groups',
      displayKey: 'name'
    }
  ];

  return (
    <div className="space-y-6">
      <MasterDataTable
        title="Customer Mappings"
        endpoint="customer-mappings"
        columns={mappingColumns}
      />
    </div>
  );
};

// --- Component Definitions ---
const Currencies: React.FC = () => {
  const columns: Column[] = [
    { key: 'code', label: 'Currency Code', required: true },
    { key: 'name', label: 'Currency Name', required: true },
    { key: 'symbol', label: 'Symbol', required: true },
    { key: 'description', label: 'Description', type: 'text', required: false },
    {
      key: 'isActive',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    }
  ];

  return (
    <MasterDataTable
      title="Currencies"
      endpoint="currencies"
      columns={columns}
    />
  );
};

const CustomerGroups: React.FC = () => {
  const columns: Column[] = [
    { key: 'name', label: 'Group Name', required: true },
    { key: 'description', label: 'Description' },
    {
      key: 'isDefault',
      label: 'Default Group',
      type: 'select',
      options: [
        { value: 'true', label: 'Yes' },
        { value: 'false', label: 'No' }
      ]
    }
  ];

  return (
    <MasterDataTable
      title="Customer Groups"
      endpoint="customer-groups"
      columns={columns}
    />
  );
};

const CustomerMappings: React.FC = () => {
  return <CustomerMappingTable />;
};

const FabCost: React.FC<{ openItemId?: string }> = ({ openItemId }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ✅ Version History Modal state
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<{ id: string; name: string } | null>(null);

  // Rejection Dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [itemToReject, setItemToReject] = useState<any>(null);

  const columns: Column[] = [
    { key: 'itemGroupCode', label: 'Item Group', type: 'select', required: true, endpoint: 'd365-item-groups', displayKey: 'code', valueKey: 'code', secondaryKey: 'name' },
    { key: 'price', label: 'Price', type: 'number', required: true },
    {
      key: 'currency',
      label: 'Currency',
      required: true,
      endpoint: 'currencies',
      displayKey: 'code',
      valueKey: 'code',
      secondaryKey: 'name',
    },
    { key: 'description', label: 'Description', type: 'text', required: false },
    { key: 'changeReason', label: 'Change Reason', type: 'text', required: false }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/data/fab-costs');
      // ✅ Filter: แสดงเฉพาะ Active และ Draft versions (ไม่แสดง Archived)
      const allData = Array.isArray(response.data) ? response.data : [];
      const filteredData = allData.filter((item: any) =>
        item.status === 'Active' || item.status === 'Draft'
      );
      setData(filteredData);
    } catch (err) {
      setError('Failed to load fab costs');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle programmatic modal opening from Dashboard navigation
  useEffect(() => {
    if (openItemId && data.length > 0) {
      const itemToOpen = data.find(item => item.id === openItemId);
      if (itemToOpen) {
        console.log('Opening Fab Cost modal for:', itemToOpen);
        setCurrentEditItem(itemToOpen);
        setShowModal(true);
      }
    }
  }, [openItemId, data]);

  const handleAdd = () => {
    setCurrentEditItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    console.log('Edit clicked:', item);
    setCurrentEditItem(item);
    setShowModal(true);
  };

  const handleViewHistory = (item: any) => {
    // ✅ Open new Version History Modal
    setSelectedRecord({
      id: item.id,
      name: item.itemGroupCodeCode || item.id.substring(0, 8)
    });
    setShowVersionHistory(true);
  };

  const handleSave = async (formData: any) => {
    try {
      if (currentEditItem) {
        await api.put(`/api/data/fab-costs/${currentEditItem.id}`, formData);
        setSuccessMessage('Fab Cost updated successfully');
      } else {
        await api.post('/api/data/fab-costs', formData);
        setSuccessMessage('Fab Cost created successfully');
      }

      setShowModal(false);
      setCurrentEditItem(null);
      loadData();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save fab cost');
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this fab cost?')) {
      return;
    }

    try {
      await api.delete(`/api/data/fab-costs/${item.id}`);
      setSuccessMessage('Fab Cost deleted successfully');
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete fab cost');
    }
  };

  const handleApprove = async (item: any) => {
    if (!confirm('Are you sure you want to approve this fab cost?')) {
      return;
    }

    try {
      await api.put(`/api/data/fab-costs/${item.id}/approve`);
      setSuccessMessage('Fab Cost approved successfully');
      setShowModal(false);
      setCurrentEditItem(null);
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Approve error:', err);
      setError(err.response?.data?.message || 'Failed to approve fab cost');
    }
  };

  const handleRejectClick = (item: any) => {
    setItemToReject(item);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      setError('กรุณากรอกเหตุผลการปฏิเสธ');
      return;
    }

    try {
      await api.delete(`/api/data/fab-costs/${itemToReject.id}`, {
        data: { rejectionReason: rejectionReason.trim() }
      });
      setSuccessMessage('Fab Cost rejected successfully');
      setShowRejectDialog(false);
      setShowModal(false);
      setCurrentEditItem(null);
      setItemToReject(null);
      setRejectionReason('');
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Reject error:', err);
      setError(err.response?.data?.message || 'Failed to reject fab cost');
    }
  };

  if (loading) return <LoadingSpinner message="Loading fab costs..." />;

  return (
    <div className="space-y-6">
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Fab Costs</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Version</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item Group</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Currency</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    v{item.version || 1}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-sm">{item.itemGroupCode} - {item.itemGroupName || 'N/A'}</td>
                <td className="px-4 py-3 text-sm">{item.price}</td>
                <td className="px-4 py-3 text-sm">{item.currency}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{item.description || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.status !== 'Approved' && (
                      <button
                        onClick={() => handleApprove(item)}
                        className="text-slate-400 hover:text-green-600 transition-colors"
                        title="Approve"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleViewHistory(item)}
                      className="text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                      title="View History"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        title={`${currentEditItem ? 'Edit' : 'Add'} Fab Cost`}
        columns={columns}
        editingItem={currentEditItem}
        onApprove={handleApprove}
        onReject={handleRejectClick}
      />

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Fab Cost History</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Version</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Cost/Hour</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Currency</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Changed By</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Changed At</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {historyData.map((history) => (
                    <tr key={history.id}>
                      <td className="px-4 py-2 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          v{history.version}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">{history.name}</td>
                      <td className="px-4 py-2 text-sm">{history.price}</td>
                      <td className="px-4 py-2 text-sm">{history.currency}</td>
                      <td className="px-4 py-2 text-sm">
                        <StatusBadge status={history.status} />
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          history.action === 'CREATE' ? 'bg-blue-100 text-blue-800' :
                          history.action === 'UPDATE' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {history.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">{history.changedBy}</td>
                      <td className="px-4 py-2 text-sm">
                        {new Date(history.changedAt).toLocaleString('th-TH')}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-600">{history.changeReason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ✅ New Version History Modal */}
      {showVersionHistory && selectedRecord && (
        <VersionHistoryModal
          isOpen={showVersionHistory}
          onClose={() => {
            setShowVersionHistory(false);
            setSelectedRecord(null);
          }}
          dataType="fabCost"
          recordId={selectedRecord.id}
          recordName={selectedRecord.name}
          onRollbackSuccess={() => {
            loadData(); // Refresh data after rollback
            setSuccessMessage('Rollback completed successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">ปฏิเสธ Fab Cost</h3>
              <p className="text-sm text-slate-600 mt-1">กรุณากรอกเหตุผลในการปฏิเสธ</p>
            </div>
            <div className="p-6">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="กรอกเหตุผลการปฏิเสธ..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                autoFocus
              />
              {error && rejectionReason.trim() === '' && (
                <p className="text-sm text-red-600 mt-2">{error}</p>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                  setItemToReject(null);
                  setError(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ยืนยันการปฏิเสธ (Confirm Reject)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StandardPrices: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ✅ Version History Modal state
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<{ id: string; name: string } | null>(null);

  const columns: Column[] = [
    {
      key: 'rawMaterialId',
      label: 'Raw Material',
      required: true,
      endpoint: 'd365-raw-materials',
      displayKey: 'name'
    },
    { key: 'price', label: 'Price', type: 'number', required: true },
    {
      key: 'currency',
      label: 'Currency',
      required: true,
      endpoint: 'currencies',
      displayKey: 'code',
      valueKey: 'code',
      secondaryKey: 'name',
    },
    { key: 'description', label: 'Description', type: 'text', required: false },
    { key: 'changeReason', label: 'Change Reason', type: 'text', required: false }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/data/standard-prices');
      // ✅ Filter: แสดงเฉพาะ Active และ Draft versions (ไม่แสดง Archived)
      const allData = Array.isArray(response.data) ? response.data : [];
      const filteredData = allData.filter((item: any) =>
        item.status === 'Active' || item.status === 'Draft'
      );
      setData(filteredData);
    } catch (err) {
      setError('Failed to load standard prices');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = () => {
    setCurrentEditItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    console.log('Edit clicked:', item);
    setCurrentEditItem(item);
    setShowModal(true);
  };

  const handleViewHistory = (item: any) => {
    // ✅ Open new Version History Modal
    setSelectedRecord({
      id: item.id,
      name: item.rawMaterialId || item.id.substring(0, 8)
    });
    setShowVersionHistory(true);
  };

  const handleSave = async (formData: any) => {
    try {
      if (currentEditItem) {
        await api.put(`/api/data/standard-prices/${currentEditItem.id}`, formData);
        setSuccessMessage('Standard Price updated successfully');
      } else {
        await api.post('/api/data/standard-prices', formData);
        setSuccessMessage('Standard Price created successfully');
      }

      setShowModal(false);
      setCurrentEditItem(null);
      loadData();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save standard price');
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this standard price?')) {
      return;
    }

    try {
      await api.delete(`/api/data/standard-prices/${item.id}`);
      setSuccessMessage('Standard Price deleted successfully');
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete standard price');
    }
  };

  const handleApprove = async (item: any) => {
    if (!confirm('Are you sure you want to approve this standard price?')) {
      return;
    }

    try {
      await api.put(`/api/data/standard-prices/${item.id}/approve`);
      setSuccessMessage('Standard Price approved successfully');
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Approve error:', err);
      setError(err.response?.data?.message || 'Failed to approve standard price');
    }
  };

  const handleFixAllStatus = async () => {
    if (!confirm('คุณต้องการแก้ไข status ของ Standard Prices ทั้งหมดจาก "Approved" เป็น "Active" หรือไม่?\n\nการกระทำนี้จะทำให้ระบบสามารถค้นหา Standard Prices ได้อีกครั้ง')) {
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/data/standard-prices/fix-status');
      console.log('[Fix Status Response]', response.data);
      setSuccessMessage(`แก้ไข status สำเร็จ: ${response.data.message || `Fixed ${response.data.count || 0} records`}`);
      loadData();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      console.error('Fix status error:', err);
      setError(err.response?.data?.message || 'Failed to fix status');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading standard prices..." />;

  return (
    <div className="space-y-6">
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Standard Prices</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={handleFixAllStatus}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            title="แก้ไข status จาก 'Approved' เป็น 'Active'"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Fix All Status
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Version</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Raw Material</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Currency</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    v{item.version || 1}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="font-medium text-slate-900">{item.rawMaterialId}</div>
                  {item.rawMaterial?.name && (
                    <div className="text-xs text-slate-500">{item.rawMaterial.name}</div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">{item.price}</td>
                <td className="px-4 py-3 text-sm">{item.currency}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.status !== 'Approved' && (
                      <button
                        onClick={() => handleApprove(item)}
                        className="text-slate-400 hover:text-green-600 transition-colors"
                        title="Approve"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleViewHistory(item)}
                      className="text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                      title="View History"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        title={`${currentEditItem ? 'Edit' : 'Add'} Standard Price`}
        columns={columns}
        editingItem={currentEditItem}
      />

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Price History</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Version</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Currency</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Changed By</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Changed At</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {historyData.map((history) => (
                    <tr key={history.id}>
                      <td className="px-4 py-2 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          v{history.version}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">{history.price}</td>
                      <td className="px-4 py-2 text-sm">{history.currency}</td>
                      <td className="px-4 py-2 text-sm">
                        <StatusBadge status={history.status} />
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          history.action === 'CREATE' ? 'bg-blue-100 text-blue-800' :
                          history.action === 'UPDATE' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {history.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">{history.changedBy}</td>
                      <td className="px-4 py-2 text-sm">
                        {new Date(history.changedAt).toLocaleString('th-TH')}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-600">{history.changeReason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ✅ New Version History Modal */}
      {showVersionHistory && selectedRecord && (
        <VersionHistoryModal
          isOpen={showVersionHistory}
          onClose={() => {
            setShowVersionHistory(false);
            setSelectedRecord(null);
          }}
          dataType="standardPrice"
          recordId={selectedRecord.id}
          recordName={selectedRecord.name}
          onRollbackSuccess={() => {
            loadData(); // Refresh data after rollback
            setSuccessMessage('Rollback completed successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}
    </div>
  );
};

const SellingFactors: React.FC<{ openItemId?: string }> = ({ openItemId }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ✅ Version History Modal state
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<{ id: string; name: string } | null>(null);

  // ✅ Rejection Dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [itemToReject, setItemToReject] = useState<any>(null);

  // v8.2: Selling Factor ใช้ tubeSize ดึงจาก Product (FG) table - แสดงเฉพาะ tubeSize
  const columns: Column[] = [
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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/data/selling-factors');
      // ✅ Filter: แสดงเฉพาะ Active และ Draft versions (ไม่แสดง Archived)
      const allData = Array.isArray(response.data) ? response.data : [];
      const filteredData = allData.filter((item: any) =>
        item.status === 'Active' || item.status === 'Draft'
      );
      setData(filteredData);
    } catch (err) {
      setError('Failed to load selling factors');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle programmatic modal opening from Dashboard navigation
  useEffect(() => {
    if (openItemId && data.length > 0) {
      const itemToOpen = data.find(item => item.id === openItemId);
      if (itemToOpen) {
        console.log('Opening Selling Factor modal for:', itemToOpen);
        setCurrentEditItem(itemToOpen);
        setShowModal(true);
      }
    }
  }, [openItemId, data]);

  const handleAdd = () => {
    setCurrentEditItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    console.log('Edit clicked:', item);
    setCurrentEditItem(item);
    setShowModal(true);
  };

  const handleViewHistory = (item: any) => {
    // ✅ Open new Version History Modal
    setSelectedRecord({
      id: item.id,
      name: `Tube Size: ${item.tubeSize}`
    });
    setShowVersionHistory(true);
  };

  const handleSave = async (formData: any) => {
    try {
      if (currentEditItem) {
        await api.put(`/api/data/selling-factors/${currentEditItem.id}`, formData);
        setSuccessMessage('Selling Factor updated successfully');
      } else {
        await api.post('/api/data/selling-factors', formData);
        setSuccessMessage('Selling Factor created successfully');
      }

      setShowModal(false);
      setCurrentEditItem(null);
      loadData();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save selling factor');
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this selling factor?')) {
      return;
    }

    try {
      await api.delete(`/api/data/selling-factors/${item.id}`);
      setSuccessMessage('Selling Factor deleted successfully');
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete selling factor');
    }
  };

  const handleApprove = async (item: any) => {
    if (!confirm('Are you sure you want to approve this selling factor?')) {
      return;
    }

    try {
      await api.put(`/api/data/selling-factors/${item.id}/approve`);
      setSuccessMessage('Selling Factor approved successfully');
      setShowModal(false);
      setCurrentEditItem(null);
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Approve error:', err);
      setError(err.response?.data?.message || 'Failed to approve selling factor');
    }
  };

  const handleRejectClick = (item: any) => {
    setItemToReject(item);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      setError('กรุณากรอกเหตุผลการปฏิเสธ');
      return;
    }

    try {
      // Delete the draft record (rejection) with reason
      await api.delete(`/api/data/selling-factors/${itemToReject.id}`, {
        data: { rejectionReason: rejectionReason.trim() }
      });
      setSuccessMessage('Selling Factor rejected successfully');
      setShowRejectDialog(false);
      setShowModal(false);
      setCurrentEditItem(null);
      setItemToReject(null);
      setRejectionReason('');
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Reject error:', err);
      setError(err.response?.data?.message || 'Failed to reject selling factor');
    }
  };

  if (loading) return <LoadingSpinner message="Loading selling factors..." />;

  return (
    <div className="space-y-6">
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Selling Factors</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Version</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Tube Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Factor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    v{item.version || 1}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-sm">{item.tubeSize}</td>
                <td className="px-4 py-3 text-sm">{item.factor}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{item.description || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.status !== 'Approved' && (
                      <button
                        onClick={() => handleApprove(item)}
                        className="text-slate-400 hover:text-green-600 transition-colors"
                        title="Approve"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleViewHistory(item)}
                      className="text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                      title="View History"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        title={`${currentEditItem ? 'Edit' : 'Add'} Selling Factor`}
        columns={columns}
        editingItem={currentEditItem}
        onApprove={handleApprove}
        onReject={handleRejectClick}
      />

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Selling Factor History</h3>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Version</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pattern Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Pattern Code</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Factor</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Action</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Changed By</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Changed At</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">Reason</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {historyData.map((history) => (
                    <tr key={history.id}>
                      <td className="px-4 py-2 text-sm">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          v{history.version}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">{history.patternName}</td>
                      <td className="px-4 py-2 text-sm">{history.patternCode}</td>
                      <td className="px-4 py-2 text-sm">{history.factor}</td>
                      <td className="px-4 py-2 text-sm">
                        <StatusBadge status={history.status} />
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          history.action === 'CREATE' ? 'bg-blue-100 text-blue-800' :
                          history.action === 'UPDATE' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {history.action}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm">{history.changedBy}</td>
                      <td className="px-4 py-2 text-sm">
                        {new Date(history.changedAt).toLocaleString('th-TH')}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-600">{history.changeReason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ✅ New Version History Modal */}
      {showVersionHistory && selectedRecord && (
        <VersionHistoryModal
          isOpen={showVersionHistory}
          onClose={() => {
            setShowVersionHistory(false);
            setSelectedRecord(null);
          }}
          dataType="sellingFactor"
          recordId={selectedRecord.id}
          recordName={selectedRecord.name}
          onRollbackSuccess={() => {
            loadData(); // Refresh data after rollback
            setSuccessMessage('Rollback completed successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">ปฏิเสธ Selling Factor</h3>
              <p className="text-sm text-slate-600 mt-1">กรุณากรอกเหตุผลในการปฏิเสธ</p>
            </div>
            <div className="p-6">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="กรอกเหตุผลการปฏิเสธ..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                autoFocus
              />
              {error && rejectionReason.trim() === '' && (
                <p className="text-sm text-red-600 mt-2">{error}</p>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                  setItemToReject(null);
                  setError(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ยืนยันการปฏิเสธ (Confirm Reject)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== SCRAP ALLOWANCE (Phase 2.2) =====
const ScrapAllowance: React.FC<{ openItemId?: string }> = ({ openItemId }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<{ id: string; name: string } | null>(null);

  // Rejection Dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [itemToReject, setItemToReject] = useState<any>(null);

  const columns: Column[] = [
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
    { key: 'scrapPercentage', label: 'Scrap Percentage (%)', type: 'number', required: true },
    { key: 'description', label: 'Description', type: 'text', required: false },
    { key: 'changeReason', label: 'Change Reason', type: 'text', required: false }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/data/scrap-allowances');
      const allData = Array.isArray(response.data) ? response.data : [];
      const filteredData = allData.filter((item: any) =>
        item.status === 'Active' || item.status === 'Draft'
      );
      setData(filteredData);
    } catch (err) {
      setError('Failed to load scrap allowances');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle programmatic modal opening from Dashboard navigation
  useEffect(() => {
    if (openItemId && data.length > 0) {
      const itemToOpen = data.find(item => item.id === openItemId);
      if (itemToOpen) {
        console.log('Opening Scrap Allowance modal for:', itemToOpen);
        setCurrentEditItem(itemToOpen);
        setShowModal(true);
      }
    }
  }, [openItemId, data]);

  const handleAdd = () => {
    setCurrentEditItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    console.log('Edit clicked:', item);
    setCurrentEditItem(item);
    setShowModal(true);
  };

  const handleViewHistory = (item: any) => {
    console.log('View History clicked (Scrap Allowance):', item);
    setSelectedRecord({
      id: item.id,
      name: `${item.itemGroupCode} - ${item.itemGroupName || 'N/A'}`
    });
    setShowVersionHistory(true);
  };

  const handleSave = async (formData: any) => {
    try {
      // Auto-populate itemGroupName from Item Group dropdown
      if (formData.itemGroupCode && !formData.itemGroupName) {
        try {
          const response = await api.get('/api/data/d365-item-groups');
          const itemGroups = Array.isArray(response.data) ? response.data : [];
          const selectedGroup = itemGroups.find((g: any) => g.code === formData.itemGroupCode);
          if (selectedGroup) {
            formData.itemGroupName = selectedGroup.name;
          }
        } catch (err) {
          console.error('Failed to fetch item group name:', err);
        }
      }

      if (currentEditItem) {
        await api.put(`/api/data/scrap-allowances/${currentEditItem.id}`, formData);
        setSuccessMessage('Scrap Allowance updated successfully');
      } else {
        await api.post('/api/data/scrap-allowances', formData);
        setSuccessMessage('Scrap Allowance created successfully');
      }

      setShowModal(false);
      setCurrentEditItem(null);
      loadData();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save scrap allowance');
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm('Are you sure you want to delete this scrap allowance?')) {
      return;
    }

    try {
      await api.delete(`/api/data/scrap-allowances/${item.id}`);
      setSuccessMessage('Scrap Allowance deleted successfully');
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete scrap allowance');
    }
  };

  const handleApprove = async (item: any) => {
    if (!confirm('Are you sure you want to approve this scrap allowance?')) {
      return;
    }

    try {
      await api.put(`/api/data/scrap-allowances/${item.id}/approve`);
      setSuccessMessage('Scrap Allowance approved successfully');
      setShowModal(false);
      setCurrentEditItem(null);
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Approve error:', err);
      setError(err.response?.data?.message || 'Failed to approve scrap allowance');
    }
  };

  const handleRejectClick = (item: any) => {
    setItemToReject(item);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      setError('กรุณากรอกเหตุผลการปฏิเสธ');
      return;
    }

    try {
      await api.delete(`/api/data/scrap-allowances/${itemToReject.id}`, {
        data: { rejectionReason: rejectionReason.trim() }
      });
      setSuccessMessage('Scrap Allowance rejected successfully');
      setShowRejectDialog(false);
      setShowModal(false);
      setCurrentEditItem(null);
      setItemToReject(null);
      setRejectionReason('');
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Reject error:', err);
      setError(err.response?.data?.message || 'Failed to reject scrap allowance');
    }
  };

  if (loading) return <LoadingSpinner message="Loading scrap allowances..." />;

  return (
    <div className="space-y-6">
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Scrap Allowance</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Version</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item Group</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Scrap %</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    v{item.version || 1}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-sm">{item.itemGroupCode} - {item.itemGroupName || 'N/A'}</td>
                <td className="px-4 py-3 text-sm">{(item.scrapPercentage * 100).toFixed(2)}%</td>
                <td className="px-4 py-3 text-sm text-slate-600">{item.description || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.status !== 'Approved' && (
                      <button
                        onClick={() => handleApprove(item)}
                        className="text-slate-400 hover:text-green-600 transition-colors"
                        title="Approve"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleViewHistory(item)}
                      className="text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                      title="View History"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        title={`${currentEditItem ? 'Edit' : 'Add'} Scrap Allowance`}
        columns={columns}
        editingItem={currentEditItem}
        onApprove={handleApprove}
        onReject={handleRejectClick}
      />

      {showVersionHistory && selectedRecord && (
        <VersionHistoryModal
          isOpen={showVersionHistory}
          onClose={() => {
            setShowVersionHistory(false);
            setSelectedRecord(null);
          }}
          dataType="scrapAllowance"
          recordId={selectedRecord.id}
          recordName={selectedRecord.name}
          onRollbackSuccess={() => {
            loadData();
            setSuccessMessage('Rollback completed successfully');
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
        />
      )}

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">ปฏิเสธ Scrap Allowance</h3>
              <p className="text-sm text-slate-600 mt-1">กรุณากรอกเหตุผลในการปฏิเสธ</p>
            </div>
            <div className="p-6">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="กรอกเหตุผลการปฏิเสธ..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                autoFocus
              />
              {error && rejectionReason.trim() === '' && (
                <p className="text-sm text-red-600 mt-2">{error}</p>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                  setItemToReject(null);
                  setError(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ยืนยันการปฏิเสธ (Confirm Reject)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LmePrices: React.FC<{ openItemId?: string }> = ({ openItemId }) => {
  // v8.0: LME with Version Control UI + Item Group Dropdown
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<string | null>(null);

  // Rejection Dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [itemToReject, setItemToReject] = useState<any>(null);

  const columns: Column[] = [
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

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/data/lme-master-data');
      const allData = Array.isArray(response.data) ? response.data : [];
      // Filter: Show only Active and Draft versions
      const filtered = allData.filter((item: any) =>
        item.status === 'Active' || item.status === 'Draft'
      );
      setData(filtered);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load LME data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle programmatic modal opening from Dashboard navigation
  useEffect(() => {
    if (openItemId && data.length > 0) {
      const itemToOpen = data.find(item => item.id === openItemId);
      if (itemToOpen) {
        console.log('Opening LME Price modal for:', itemToOpen);
        setEditingItem(itemToOpen);
        setShowModal(true);
      }
    }
  }, [openItemId, data]);

  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    console.log('Edit clicked (LME/ExchangeRate):', item);
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSave = async (formData: any) => {
    try {
      // Auto-populate itemGroupName from selected itemGroupCode
      if (formData.itemGroupCode && !formData.itemGroupName) {
        const response = await api.get('/api/data/d365-item-groups');
        const itemGroups = Array.isArray(response.data) ? response.data : [];
        const selectedGroup = itemGroups.find((g: any) => g.code === formData.itemGroupCode);
        if (selectedGroup) {
          formData.itemGroupName = selectedGroup.name;
        }
      }

      // Auto-populate currency name if not present
      if (formData.currency && !formData.currencyName) {
        const response = await api.get('/api/data/currencies');
        const currencies = Array.isArray(response.data) ? response.data : [];
        const selectedCurrency = currencies.find((c: any) => c.code === formData.currency);
        if (selectedCurrency) {
          formData.currencyName = selectedCurrency.name;
        }
      }

      if (editingItem) {
        await api.put(`/api/data/lme-master-data/${editingItem.id}`, formData);
        setSuccessMessage('LME Price updated successfully');
      } else {
        await api.post('/api/data/lme-master-data', formData);
        setSuccessMessage('LME Price created successfully');
      }

      setShowModal(false);
      setEditingItem(null);
      await loadData();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save LME data');
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Delete ${item.itemGroupCodeCode} v${item.version}?`)) return;

    try {
      await api.delete(`/api/data/lme-master-data/${item.id}`);
      setSuccessMessage('LME Price deleted successfully');
      await loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete LME data');
    }
  };

  const handleApprove = async (item: any) => {
    if (!confirm(`Approve ${item.itemGroupCodeCode} v${item.version}? This will archive the current Active version.`)) return;

    try {
      const username = 'admin'; // TODO: Get from auth context
      await api.put(`/api/data/lme-master-data/${item.id}/approve`, { username });
      setSuccessMessage('LME Price approved successfully');
      setShowModal(false);
      setEditingItem(null);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Approve error:', err);
      setError(err.response?.data?.message || 'Failed to approve LME data');
    }
  };

  const handleRejectClick = (item: any) => {
    setItemToReject(item);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      setError('กรุณากรอกเหตุผลการปฏิเสธ');
      return;
    }

    try {
      await api.delete(`/api/data/lme-master-data/${itemToReject.id}`, {
        data: { rejectionReason: rejectionReason.trim() }
      });
      setSuccessMessage('LME Price rejected successfully');
      setShowRejectDialog(false);
      setShowModal(false);
      setEditingItem(null);
      setItemToReject(null);
      setRejectionReason('');
      await loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Reject error:', err);
      setError(err.response?.data?.message || 'Failed to reject LME Price');
    }
  };

  const handleViewHistory = (item: any) => {
    console.log('View History clicked (LME/ExchangeRate):', item);
    setSelectedItemForHistory(item.id);
    setShowVersionHistory(true);
  };

  if (loading) return <LoadingSpinner message="Loading LME prices..." />;

  return (
    <div className="space-y-6">
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">LME</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Version</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item Group</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price (THB)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Currency</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-sm">v{item.version}</td>
                <td className="px-4 py-3 text-sm">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-sm">
                  {item.itemGroupCode} - {item.itemGroupName || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {parseFloat(item.price).toFixed(4)}
                </td>
                <td className="px-4 py-3 text-sm">{item.currency}</td>
                <td className="px-4 py-3 text-sm">{item.description || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.status !== 'Approved' && (
                      <button
                        onClick={() => handleApprove(item)}
                        className="text-slate-400 hover:text-green-600 transition-colors"
                        title="Approve"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleViewHistory(item)}
                      className="text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                      title="View History"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditModal
        isOpen={showModal}
        title={editingItem ? 'Edit LME Price' : 'Add New LME Price'}
        columns={columns}
        editingItem={editingItem}
        onSave={handleSave}
        onClose={() => {
          setShowModal(false);
          setEditingItem(null);
        }}
        onApprove={handleApprove}
        onReject={handleRejectClick}
      />

      {showVersionHistory && selectedItemForHistory && (
        <VersionHistoryModal
          isOpen={showVersionHistory}
          dataType="lme"
          recordId={selectedItemForHistory}
          recordName="LME Price"
          onClose={() => {
            setShowVersionHistory(false);
            setSelectedItemForHistory(null);
          }}
          onRollbackSuccess={loadData}
        />
      )}

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">ปฏิเสธ LME Price</h3>
              <p className="text-sm text-slate-600 mt-1">กรุณากรอกเหตุผลในการปฏิเสธ</p>
            </div>
            <div className="p-6">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="กรอกเหตุผลการปฏิเสธ..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                autoFocus
              />
              {error && rejectionReason.trim() === '' && (
                <p className="text-sm text-red-600 mt-2">{error}</p>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                  setItemToReject(null);
                  setError(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ยืนยันการปฏิเสธ (Confirm Reject)
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

const ExchangeRates: React.FC<{ openItemId?: string }> = ({ openItemId }) => {
  // v8.0: Exchange Rate Master Data with Version Control UI
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedItemForHistory, setSelectedItemForHistory] = useState<string | null>(null);

  // Rejection Dialog state
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [itemToReject, setItemToReject] = useState<any>(null);

  const columns: Column[] = [
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

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/data/exchange-rate-master-data');
      const allData = Array.isArray(response.data) ? response.data : [];
      // Filter: Show only Active and Draft versions
      const filtered = allData.filter((item: any) =>
        item.status === 'Active' || item.status === 'Draft'
      );
      setData(filtered);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load exchange rate data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle programmatic modal opening from Dashboard navigation
  useEffect(() => {
    if (openItemId && data.length > 0) {
      const itemToOpen = data.find(item => item.id === openItemId);
      if (itemToOpen) {
        console.log('Opening Exchange Rate modal for:', itemToOpen);
        setEditingItem(itemToOpen);
        setShowModal(true);
      }
    }
  }, [openItemId, data]);

  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    console.log('Edit clicked (LME/ExchangeRate):', item);
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSave = async (formData: any) => {
    try {
      // Auto-populate currency names from selected currency codes
      if (formData.sourceCurrencyCode && !formData.sourceCurrencyName) {
        const response = await api.get('/api/data/currencies');
        const currencies = Array.isArray(response.data) ? response.data : [];
        const selectedCurrency = currencies.find((c: any) => c.code === formData.sourceCurrencyCode);
        if (selectedCurrency) {
          formData.sourceCurrencyName = selectedCurrency.name;
        }
      }

      if (formData.destinationCurrencyCode && !formData.destinationCurrencyName) {
        const response = await api.get('/api/data/currencies');
        const currencies = Array.isArray(response.data) ? response.data : [];
        const selectedCurrency = currencies.find((c: any) => c.code === formData.destinationCurrencyCode);
        if (selectedCurrency) {
          formData.destinationCurrencyName = selectedCurrency.name;
        }
      }

      if (editingItem) {
        await api.put(`/api/data/exchange-rate-master-data/${editingItem.id}`, formData);
        setSuccessMessage('Exchange Rate updated successfully');
      } else {
        await api.post('/api/data/exchange-rate-master-data', formData);
        setSuccessMessage('Exchange Rate created successfully');
      }

      setShowModal(false);
      setEditingItem(null);
      await loadData();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || 'Failed to save exchange rate data');
    }
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`Delete ${item.sourceCurrencyCode} → ${item.destinationCurrencyCode} v${item.version}?`)) return;

    try {
      await api.delete(`/api/data/exchange-rate-master-data/${item.id}`);
      setSuccessMessage('Exchange Rate deleted successfully');
      await loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete exchange rate data');
    }
  };

  const handleApprove = async (item: any) => {
    if (!confirm(`Approve ${item.sourceCurrencyCode} → ${item.destinationCurrencyCode} v${item.version}? This will archive the current Active version.`)) return;

    try {
      const username = 'admin'; // TODO: Get from auth context
      await api.put(`/api/data/exchange-rate-master-data/${item.id}/approve`, { username });
      setSuccessMessage('Exchange Rate approved successfully');
      setShowModal(false);
      setEditingItem(null);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Approve error:', err);
      setError(err.response?.data?.message || 'Failed to approve exchange rate data');
    }
  };

  const handleRejectClick = (item: any) => {
    setItemToReject(item);
    setRejectionReason('');
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      setError('กรุณากรอกเหตุผลการปฏิเสธ');
      return;
    }

    try {
      await api.delete(`/api/data/exchange-rate-master-data/${itemToReject.id}`, {
        data: { rejectionReason: rejectionReason.trim() }
      });
      setSuccessMessage('Exchange Rate rejected successfully');
      setShowRejectDialog(false);
      setShowModal(false);
      setEditingItem(null);
      setItemToReject(null);
      setRejectionReason('');
      await loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Reject error:', err);
      setError(err.response?.data?.message || 'Failed to reject Exchange Rate');
    }
  };

  const handleViewHistory = (item: any) => {
    console.log('View History clicked (LME/ExchangeRate):', item);
    setSelectedItemForHistory(item.id);
    setShowVersionHistory(true);
  };

  if (loading) return <LoadingSpinner message="Loading exchange rates..." />;

  return (
    <div className="space-y-6">
      {successMessage && (
        <SuccessMessage
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Exchange Rate Master Data</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Version</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">From Currency</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">To Currency</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 text-sm">v{item.version}</td>
                <td className="px-4 py-3 text-sm">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3 text-sm">
                  {item.sourceCurrencyCode} - {item.sourceCurrencyName || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {item.destinationCurrencyCode} - {item.destinationCurrencyName || 'N/A'}
                </td>
                <td className="px-4 py-3 text-sm">
                  {parseFloat(item.rate).toFixed(6)}
                </td>
                <td className="px-4 py-3 text-sm">{item.description || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {item.status !== 'Approved' && (
                      <button
                        onClick={() => handleApprove(item)}
                        className="text-slate-400 hover:text-green-600 transition-colors"
                        title="Approve"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleViewHistory(item)}
                      className="text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                      title="View History"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditModal
        isOpen={showModal}
        title={editingItem ? 'Edit Exchange Rate' : 'Add New Exchange Rate'}
        columns={columns}
        editingItem={editingItem}
        onSave={handleSave}
        onClose={() => {
          setShowModal(false);
          setEditingItem(null);
        }}
        onApprove={handleApprove}
        onReject={handleRejectClick}
      />

      {showVersionHistory && selectedItemForHistory && (
        <VersionHistoryModal
          isOpen={showVersionHistory}
          dataType="exchangeRate"
          recordId={selectedItemForHistory}
          recordName="Exchange Rate"
          onClose={() => {
            setShowVersionHistory(false);
            setSelectedItemForHistory(null);
          }}
          onRollbackSuccess={loadData}
        />
      )}

      {/* Rejection Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">ปฏิเสธ Exchange Rate</h3>
              <p className="text-sm text-slate-600 mt-1">กรุณากรอกเหตุผลในการปฏิเสธ</p>
            </div>
            <div className="p-6">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="กรอกเหตุผลการปฏิเสธ..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                rows={4}
                autoFocus
              />
              {error && rejectionReason.trim() === '' && (
                <p className="text-sm text-red-600 mt-2">{error}</p>
              )}
            </div>
            <div className="p-6 border-t border-slate-200 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason('');
                  setItemToReject(null);
                  setError(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                ยกเลิก (Cancel)
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ยืนยันการปฏิเสธ (Confirm Reject)
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};


// --- Market Data Reference Components ---
const MarketDataReference: React.FC = () => {
  const [lmeData, setLmeData] = useState<any[]>([]);
  const [exchangeRateData, setExchangeRateData] = useState<any[]>([]);
  const [lmeHistory, setLmeHistory] = useState<any[]>([]);
  const [exchangeRateHistory, setExchangeRateHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<{ lme: string | null; exchangeRate: string | null }>({
    lme: null,
    exchangeRate: null
  });
  const [selectedMetal, setSelectedMetal] = useState<string>('Copper');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

  const fetchLMEPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/market-data/lme-reference');
      setLmeData(response.data.data || []);
      setLastSyncTime(prev => ({ ...prev, lme: new Date().toLocaleString('th-TH') }));
      setSuccessMessage('ดึงข้อมูล LME ล่าสุดสำเร็จ');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Auto-load history after fetching new data
      await fetchLMEHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล LME');
    } finally {
      setLoading(false);
    }
  };

  const fetchExchangeRates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api/market-data/exchange-rate-reference');
      setExchangeRateData(response.data.data || []);
      setLastSyncTime(prev => ({ ...prev, exchangeRate: new Date().toLocaleString('th-TH') }));
      setSuccessMessage('ดึงข้อมูลอัตราแลกเปลี่ยนจาก BOT สำเร็จ');
      setTimeout(() => setSuccessMessage(null), 3000);

      // Auto-load history after fetching new data
      await fetchExchangeRateHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลอัตราแลกเปลี่ยน');
    } finally {
      setLoading(false);
    }
  };

  const fetchLMEHistory = async () => {
    try {
      const params = new URLSearchParams({
        metal: selectedMetal,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const response = await api.get(`/api/market-data/lme-reference/history?${params}`);
      setLmeHistory(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching LME history:', err);
    }
  };

  const fetchExchangeRateHistory = async () => {
    try {
      const currencyMatch = selectedCurrency.match(/^([A-Z]{3})/);
      const currencyCode = currencyMatch ? currencyMatch[1] : selectedCurrency;

      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      const response = await api.get(`/api/market-data/exchange-rate-reference/history?${params}`);

      // Filter by currency on client side
      const allHistory = response.data.data || [];
      const filtered = allHistory.filter((item: any) =>
        item.currency.includes(currencyCode)
      );
      setExchangeRateHistory(filtered);
    } catch (err: any) {
      console.error('Error fetching exchange rate history:', err);
    }
  };

  // Auto-fetch history when filters change
  useEffect(() => {
    if (lmeData.length > 0) {
      fetchLMEHistory();
    }
  }, [selectedMetal, dateRange]);

  useEffect(() => {
    if (exchangeRateData.length > 0) {
      fetchExchangeRateHistory();
    }
  }, [selectedCurrency, dateRange]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-900">ข้อมูล Reference จากแหล่งภายนอก</h3>
            <p className="text-sm text-blue-700 mt-1">
              ข้อมูลเหล่านี้เป็นข้อมูลอ้างอิงจากแหล่งภายนอก (LME Prices, BOT Exchange Rates)
              <span className="font-medium"> ไม่มีผลต่อการคำนวณราคาในระบบ</span>
              เก็บไว้เพื่อเป็น reference เปรียบเทียบเท่านั้น
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* LME Prices Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">LME Prices Reference</h3>
            <p className="text-sm text-slate-600 mt-1">
              ราคา LME อ้างอิงจากตลาดโลหะ London Metal Exchange
            </p>
            {lastSyncTime.lme && (
              <p className="text-xs text-slate-500 mt-1">
                อัพเดตล่าสุด: {lastSyncTime.lme}
              </p>
            )}
          </div>
          <button
            onClick={fetchLMEPrices}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลล่าสุด'}
          </button>
        </div>

        {lmeData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Metal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Price (USD)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Change (%)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {lmeData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.metal}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.price?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.unit}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={item.change >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                        {item.change >= 0 ? '+' : ''}{item.change}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Exchange Rates Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Exchange Rates Reference (BOT)</h3>
            <p className="text-sm text-slate-600 mt-1">
              อัตราแลกเปลี่ยนอ้างอิงจากธนาคารแห่งประเทศไทย
            </p>
            {lastSyncTime.exchangeRate && (
              <p className="text-xs text-slate-500 mt-1">
                อัพเดตล่าสุด: {lastSyncTime.exchangeRate}
              </p>
            )}
          </div>
          <button
            onClick={fetchExchangeRates}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลล่าสุด'}
          </button>
        </div>

        {exchangeRateData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Currency</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Buying Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Selling Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {exchangeRateData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.currency}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.buyingRate?.toFixed(4)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.sellingRate?.toFixed(4)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Data & Charts Section */}
      {(lmeData.length > 0 || exchangeRateData.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">📊 กราฟแสดงประวัติข้อมูล (Historical Trends)</h3>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setDateRange({
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                  });
                }}
                className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
              >
                รีเซ็ต (30 วันล่าสุด)
              </button>
            </div>
          </div>

          {/* LME Price History Chart */}
          {lmeData.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-slate-800">เทรนด์ราคา LME</h4>
                <select
                  value={selectedMetal}
                  onChange={(e) => setSelectedMetal(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Copper">Copper (ทองแดง)</option>
                  <option value="Aluminium">Aluminium (อลูมิเนียม)</option>
                  <option value="Zinc">Zinc (สังกะสี)</option>
                  <option value="Nickel">Nickel (นิกเกิล)</option>
                  <option value="Lead">Lead (ตะกั่ว)</option>
                  <option value="Tin">Tin (ดีบุก)</option>
                </select>
              </div>

              {lmeHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={lmeHistory.map(item => ({
                    date: new Date(item.fetchedAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
                    price: item.price,
                    metal: item.metal
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                      formatter={(value: any) => [`${value.toLocaleString()} USD`, 'ราคา']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                      name={`ราคา ${selectedMetal}`}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  ยังไม่มีข้อมูลประวัติ กรุณาดึงข้อมูลใหม่อย่างน้อย 2 ครั้งเพื่อดูกราฟ
                </div>
              )}

              <p className="text-xs text-slate-500 mt-2">
                * แสดงข้อมูล {lmeHistory.length} รายการจากวันที่ {dateRange.startDate} ถึง {dateRange.endDate}
              </p>
            </div>
          )}

          {/* Exchange Rate History Chart */}
          {exchangeRateData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-md font-semibold text-slate-800">เทรนด์อัตราแลกเปลี่ยน (BOT)</h4>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {exchangeRateData.map((item, idx) => (
                    <option key={idx} value={item.currency}>
                      {item.currency}
                    </option>
                  ))}
                </select>
              </div>

              {exchangeRateHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={exchangeRateHistory.map(item => ({
                    date: new Date(item.fetchedAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
                    buyingRate: item.buyingRate,
                    sellingRate: item.sellingRate
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px'
                      }}
                      formatter={(value: any) => [`${value.toFixed(4)} THB`, '']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="buyingRate"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                      name="อัตราซื้อ"
                    />
                    <Line
                      type="monotone"
                      dataKey="sellingRate"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', r: 4 }}
                      name="อัตราขาย"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  ยังไม่มีข้อมูลประวัติ กรุณาดึงข้อมูลใหม่อย่างน้อย 2 ครั้งเพื่อดูกราฟ
                </div>
              )}

              <p className="text-xs text-slate-500 mt-2">
                * แสดงข้อมูล {exchangeRateHistory.length} รายการจากวันที่ {dateRange.startDate} ถึง {dateRange.endDate}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Tab Group Component ---
interface SubTab {
  id: string;
  label: string;
  component: React.FC<{ openItemId?: string }>;
}

interface TabGroup {
  id: string;
  label: string;
  icon: string;
  subTabs?: SubTab[];
  component?: React.FC<{ openItemId?: string }>;
}

// --- Main MasterData Component ---
interface MasterDataProps {
  modalTrigger?: {
    entityType?: string;
    entityId?: string;
    openModal?: boolean;
  } | null;
}

const MasterData: React.FC<MasterDataProps> = ({ modalTrigger }) => {
  const [activeTab, setActiveTab] = useState('mongodb');
  const [activeSubTab, setActiveSubTab] = useState<string>('');

  // State to hold the entityId for opening modal
  const [openItemId, setOpenItemId] = useState<string | undefined>(undefined);
  // Flag to prevent auto sub-tab initialization when programmatically navigating
  const [skipSubTabInit, setSkipSubTabInit] = useState(false);
  // Track the last processed trigger to avoid re-processing
  const [lastProcessedTrigger, setLastProcessedTrigger] = useState<string | null>(null);

  // ✅ โครงสร้างใหม่: 7 กลุ่มหลัก พร้อม sub-tabs (เพิ่ม BOQ Management)
  const tabGroups: TabGroup[] = [
    {
      id: 'mongodb',
      label: 'MongoDB Sync',
      icon: '🔄',
      subTabs: [
        { id: 'import', label: 'Import Data', component: ImportManager },
        { id: 'viewData', label: 'View MongoDB Data', component: MasterDataViewer },
      ]
    },
    {
      id: 'boq',
      label: 'BOQ Management',
      icon: '📋',
      subTabs: [
        { id: 'viewBOQ', label: 'View BOQ', component: BOQViewer },
        { id: 'editBOQ', label: 'Create/Edit BOQ', component: BOQEditor },
        { id: 'itemMapping', label: 'Item Mapping', component: ItemMappingManager },
      ]
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: '👥',
      subTabs: [
        { id: 'customerGroups', label: 'Customer Groups', component: CustomerGroups },
        { id: 'customerMappings', label: 'Customer Mappings', component: CustomerMappings },
      ]
    },
    {
      id: 'pricing',
      label: 'Pricing Master',
      icon: '💰',
      subTabs: [
        { id: 'lmePrices', label: 'LME', component: LmePrices },
        { id: 'fabCost', label: 'Fab Costs', component: FabCost },
        { id: 'sellingFactors', label: 'Selling Factors', component: SellingFactors },
        { id: 'scrapAllowance', label: 'Scrap Allowance', component: ScrapAllowance },
        { id: 'exchangeRates', label: 'Exchange Rates', component: ExchangeRates },
      ]
    },
    {
      id: 'marketData',
      label: 'Market Data Reference',
      icon: '📈',
      component: MarketDataReference, // Single component, no sub-tabs
    },
    {
      id: 'system',
      label: 'System Config',
      icon: '⚙️',
      component: Currencies, // Single component, no sub-tabs
    },
    {
      id: 'logs',
      label: 'Activity Logs',
      icon: '📊',
      component: () => <ActivityLogs title="Activity Logs ทั้งหมด" />,
    },
  ];

  // Initialize activeSubTab when activeTab changes
  React.useEffect(() => {
    // Skip auto-initialization if we're programmatically navigating from Dashboard
    if (skipSubTabInit) {
      console.log('Skipping sub-tab initialization (programmatic navigation)');
      return;
    }

    console.log('Auto-initializing sub-tab for activeTab:', activeTab, 'current activeSubTab:', activeSubTab);
    const currentGroup = tabGroups.find(g => g.id === activeTab);
    if (currentGroup?.subTabs && currentGroup.subTabs.length > 0) {
      // Only initialize if activeSubTab is empty or invalid for current tab
      const isValidSubTab = currentGroup.subTabs.some(st => st.id === activeSubTab);
      if (!activeSubTab || !isValidSubTab) {
        console.log('Initializing to first sub-tab:', currentGroup.subTabs[0].id);
        setActiveSubTab(currentGroup.subTabs[0].id);
      } else {
        console.log('activeSubTab is already valid, keeping it:', activeSubTab);
      }
    } else {
      setActiveSubTab('');
    }
  }, [activeTab, skipSubTabInit]);

  // Handle modal trigger from Dashboard navigation
  React.useEffect(() => {
    console.log('MasterData modalTrigger changed:', modalTrigger);

    if (modalTrigger?.openModal && modalTrigger?.entityType && modalTrigger?.entityId) {
      // Create a unique key for this trigger
      const triggerKey = `${modalTrigger.entityType}-${modalTrigger.entityId}`;

      // Skip if we already processed this trigger
      if (triggerKey === lastProcessedTrigger) {
        console.log('Already processed this trigger, skipping');
        return;
      }

      console.log('Processing new trigger:', triggerKey);
      setLastProcessedTrigger(triggerKey);

      // Map entity type to appropriate tab and sub-tab
      const entityTypeToTab: Record<string, { tab: string; subTab: string }> = {
        'fab-cost': { tab: 'pricing', subTab: 'fabCost' },
        'selling-factor': { tab: 'pricing', subTab: 'sellingFactors' },
        'lme-price': { tab: 'pricing', subTab: 'lmePrices' },
        'exchange-rate': { tab: 'pricing', subTab: 'exchangeRates' },
        'scrap-allowance': { tab: 'pricing', subTab: 'scrapAllowance' },
      };

      const targetTab = entityTypeToTab[modalTrigger.entityType];
      console.log('Entity type:', modalTrigger.entityType, '→ Target tab:', targetTab);

      if (targetTab) {
        console.log('Setting activeTab to:', targetTab.tab, 'activeSubTab to:', targetTab.subTab);

        // Set flag to skip sub-tab initialization
        setSkipSubTabInit(true);

        // Use setState callback to ensure proper sequence
        setActiveTab(targetTab.tab);
        // Set activeSubTab in next tick to ensure activeTab is updated first
        setTimeout(() => {
          setActiveSubTab(targetTab.subTab);
          console.log('ActiveSubTab set to:', targetTab.subTab);
        }, 10);

        // Set the item ID to trigger modal opening after tabs are set
        setTimeout(() => {
          console.log('Setting openItemId to:', modalTrigger.entityId);
          setOpenItemId(modalTrigger.entityId);
        }, 200);

        // Clear the skipSubTabInit flag after tabs are fully set
        setTimeout(() => {
          console.log('Clearing skipSubTabInit flag');
          setSkipSubTabInit(false);
        }, 300);

        // Clear the openItemId after component has processed it
        setTimeout(() => {
          console.log('Clearing openItemId');
          setOpenItemId(undefined);
        }, 3000);
      } else {
        console.warn('No target tab found for entity type:', modalTrigger.entityType);
      }
    }
  }, [modalTrigger, lastProcessedTrigger]);

  const renderContent = () => {
    const activeGroup = tabGroups.find(g => g.id === activeTab);
    console.log('renderContent - activeTab:', activeTab, 'activeSubTab:', activeSubTab, 'openItemId:', openItemId);

    if (!activeGroup) return <div className="text-center py-8 text-slate-500">Select a category</div>;

    // If group has sub-tabs, render active sub-tab component
    if (activeGroup.subTabs) {
      const activeSubTabData = activeGroup.subTabs.find(st => st.id === activeSubTab);
      console.log('Found activeSubTabData:', activeSubTabData?.id);
      if (activeSubTabData) {
        const Component = activeSubTabData.component;
        // Pass openItemId prop to the component
        console.log('Rendering component with openItemId:', openItemId);
        return <Component key={activeSubTab} openItemId={openItemId} />;
      }
    }

    // Otherwise render group component directly
    if (activeGroup.component) {
      const Component = activeGroup.component;
      return <Component key={activeTab} openItemId={openItemId} />;
    }

    return <div className="text-center py-8 text-slate-500">No content available</div>;
  };

  const activeGroup = tabGroups.find(g => g.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Master Data Management</h1>
          <p className="text-slate-600">Manage all master data for the pricing system.</p>
        </div>
      </div>

      {/* Primary Tabs (Main Groups) */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-6" aria-label="Main Tabs">
          {tabGroups.map(group => (
            <button
              key={group.id}
              onClick={() => setActiveTab(group.id)}
              className={`${
                activeTab === group.id
                  ? 'border-blue-500 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-3 px-2 border-b-2 text-sm transition-colors flex items-center gap-2`}
            >
              <span className="text-lg">{group.icon}</span>
              <span>{group.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Secondary Tabs (Sub-tabs) */}
      {activeGroup?.subTabs && activeGroup.subTabs.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-2">
          <nav className="flex space-x-2" aria-label="Sub Tabs">
            {activeGroup.subTabs.map(subTab => (
              <button
                key={subTab.id}
                onClick={() => setActiveSubTab(subTab.id)}
                className={`${
                  activeSubTab === subTab.id
                    ? 'bg-white text-blue-600 font-medium shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                } px-4 py-2 rounded-md text-sm transition-all`}
              >
                {subTab.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Content */}
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default MasterData;


