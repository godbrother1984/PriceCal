// path: client/src/pages/MasterData.tsx
// version: 3.8 (Update Customer Groups - Remove type, Add isDefault)
// last-modified: 1 ตุลาคม 2568 18:35

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import ActivityLogs from '../components/ActivityLogs';
import ImportManager from '../components/ImportManager';
import MasterDataViewer from '../components/MasterDataViewer';

// --- API Configuration ---
const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 10000,
});

// Add response interceptor to handle API responses consistently
api.interceptors.response.use(
  (response) => {
    if (response.data?.success && response.data?.data !== undefined) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// --- Types ---
interface Column {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'select';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  endpoint?: string;
  displayKey?: string;
}

interface MasterItem {
  [key: string]: any;
}

interface MasterDataTableProps {
  title: string;
  endpoint: string;
  columns: Column[];
  editingItem?: MasterItem | null;
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  columns: Column[];
  editingItem?: MasterItem | null;
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
  disabled?: boolean;
}> = ({ 
  endpoint, 
  value, 
  onChange, 
  placeholder = "Type to search...", 
  displayKey = "name",
  disabled = false
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

  // Load options
  const loadOptions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/data/${endpoint}`);
      setOptions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(`Error loading ${endpoint}:`, error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  // Update input value when value prop changes
  useEffect(() => {
    if (value && options.length > 0) {
      const selected = options.find(opt => opt.id === value);
      setInputValue(selected ? `${selected.id} - ${selected[displayKey]}` : value);
      setSearchTerm('');
    } else if (!value) {
      setInputValue('');
      setSearchTerm('');
    }
  }, [value, options, displayKey]);

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
    onChange(option.id);
    setInputValue(`${option.id} - ${option[displayKey]}`);
    setSearchTerm('');
    setIsOpen(false);
  };

  // Handle input blur (with delay to allow option click)
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
      // Reset to selected value if no valid selection was made
      if (value && options.length > 0) {
        const selected = options.find(opt => opt.id === value);
        setInputValue(selected ? `${selected.id} - ${selected[displayKey]}` : '');
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
  const filteredOptions = searchTerm.length > 0 
    ? options.filter(option =>
        option.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option[displayKey]?.toLowerCase().includes(searchTerm.toLowerCase())
      )
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
                key={option.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(option)}
                className={`w-full px-3 py-2.5 text-left text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-b-0 ${
                  value === option.id ? 'bg-blue-50 text-blue-600' : 'text-slate-900'
                }`}
              >
                <div>
                  <div className="font-medium">{option.id}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{option[displayKey] || 'N/A'}</div>
                </div>
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
  editingItem 
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

        <div className="flex gap-3 p-6 border-t border-slate-200 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="master-data-form"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
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
  editingItem 
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
                    {columns.map(column => (
                      <td key={column.key} className="px-4 py-3 text-sm text-slate-900">
                        {(() => {
                          if (column.key === 'currency' || column.key.includes('Currency')) {
                            return item[`${column.key}Name`] || item[column.key] || 'N/A';
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

const FabCost: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const columns: Column[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'costPerHour', label: 'Cost Per Hour', type: 'number', required: true },
    {
      key: 'currency',
      label: 'Currency',
      required: true,
      endpoint: 'currencies',
      displayKey: 'code'
    },
    { key: 'description', label: 'Description', type: 'text', required: false },
    { key: 'changeReason', label: 'Change Reason', type: 'text', required: false }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/data/fab-costs');
      setData(Array.isArray(response.data) ? response.data : []);
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

  const handleAdd = () => {
    setCurrentEditItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setCurrentEditItem(item);
    setShowModal(true);
  };

  const handleViewHistory = async (item: any) => {
    try {
      const response = await api.get(`/api/data/fab-costs/history/${item.id}`);
      setHistoryData(response.data);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError('Failed to load cost history');
    }
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
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Approve error:', err);
      setError(err.response?.data?.message || 'Failed to approve fab cost');
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
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cost/Hour</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Currency</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
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
                <td className="px-4 py-3 text-sm">{item.name}</td>
                <td className="px-4 py-3 text-sm">{item.costPerHour}</td>
                <td className="px-4 py-3 text-sm">{item.currency}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
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
                      className="text-slate-400 hover:text-purple-600 transition-colors"
                      title="View History"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
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
                      <td className="px-4 py-2 text-sm">{history.costPerHour}</td>
                      <td className="px-4 py-2 text-sm">{history.currency}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          history.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {history.status}
                        </span>
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
      displayKey: 'code'
    },
    { key: 'changeReason', label: 'Change Reason', type: 'text', required: false }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/data/standard-prices');
      setData(Array.isArray(response.data) ? response.data : []);
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
    setCurrentEditItem(item);
    setShowModal(true);
  };

  const handleViewHistory = async (item: any) => {
    try {
      const response = await api.get(`/api/data/standard-prices/history/${item.id}`);
      setHistoryData(response.data);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError('Failed to load price history');
    }
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
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Raw Material</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Currency</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
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
                <td className="px-4 py-3 text-sm">{item.rawMaterial?.name || item.rawMaterialId}</td>
                <td className="px-4 py-3 text-sm">{item.price}</td>
                <td className="px-4 py-3 text-sm">{item.currency}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
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
                      className="text-slate-400 hover:text-purple-600 transition-colors"
                      title="View History"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
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
                        <span className={`px-2 py-1 rounded text-xs ${
                          history.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {history.status}
                        </span>
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
    </div>
  );
};

const SellingFactors: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const columns: Column[] = [
    { key: 'patternName', label: 'Pattern Name', type: 'text', required: true },
    { key: 'patternCode', label: 'Pattern Code', type: 'text', required: true },
    { key: 'factor', label: 'Factor', type: 'number', required: true },
    {
      key: 'customerGroupId',
      label: 'Customer Group',
      required: false,
      endpoint: 'customer-groups',
      displayKey: 'name'
    },
    { key: 'description', label: 'Description', type: 'text', required: false },
    { key: 'changeReason', label: 'Change Reason', type: 'text', required: false }
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/data/selling-factors');
      setData(Array.isArray(response.data) ? response.data : []);
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

  const handleAdd = () => {
    setCurrentEditItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setCurrentEditItem(item);
    setShowModal(true);
  };

  const handleViewHistory = async (item: any) => {
    try {
      const response = await api.get(`/api/data/selling-factors/history/${item.id}`);
      setHistoryData(response.data);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Failed to load history:', err);
      setError('Failed to load selling factor history');
    }
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
      loadData();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      console.error('Approve error:', err);
      setError(err.response?.data?.message || 'Failed to approve selling factor');
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
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pattern Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Pattern Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Factor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Customer Group</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
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
                <td className="px-4 py-3 text-sm">{item.patternName}</td>
                <td className="px-4 py-3 text-sm">{item.patternCode}</td>
                <td className="px-4 py-3 text-sm">{item.factor}</td>
                <td className="px-4 py-3 text-sm">{item.customerGroup?.name || 'All Groups'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
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
                      className="text-slate-400 hover:text-purple-600 transition-colors"
                      title="View History"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
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
                        <span className={`px-2 py-1 rounded text-xs ${
                          history.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {history.status}
                        </span>
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
    </div>
  );
};

const LmePrices: React.FC = () => {
  const columns: Column[] = [
    { key: 'itemGroupName', label: 'Item Group Name', type: 'text', required: true },
    { key: 'itemGroupCode', label: 'Item Group Code', type: 'text', required: true },
    { key: 'price', label: 'Price', type: 'number', required: true },
    {
      key: 'currency',
      label: 'Currency',
      required: true,
      endpoint: 'currencies',
      displayKey: 'code'
    },
    {
      key: 'customerGroupId',
      label: 'Customer Group',
      required: false,
      endpoint: 'customer-groups',
      displayKey: 'name'
    },
    { key: 'description', label: 'Description', type: 'text', required: false }
  ];

  return (
    <MasterDataTable
      title="LME Master Data"
      endpoint="lme-master-data"
      columns={columns}
    />
  );
};

const ExchangeRates: React.FC = () => {
  const columns: Column[] = [
    { key: 'sourceCurrencyCode', label: 'From Currency Code', type: 'text', required: true },
    { key: 'sourceCurrencyName', label: 'From Currency Name', type: 'text', required: true },
    { key: 'destinationCurrencyCode', label: 'To Currency Code', type: 'text', required: true },
    { key: 'destinationCurrencyName', label: 'To Currency Name', type: 'text', required: true },
    { key: 'rate', label: 'Exchange Rate', type: 'number', required: true },
    {
      key: 'customerGroupId',
      label: 'Customer Group',
      required: false,
      endpoint: 'customer-groups',
      displayKey: 'name'
    },
    { key: 'description', label: 'Description', type: 'text', required: false }
  ];

  return (
    <MasterDataTable
      title="Exchange Rate Master Data"
      endpoint="exchange-rate-master-data"
      columns={columns}
    />
  );
};


// --- Main MasterData Component ---
const MasterData: React.FC = () => {
  const [activeTab, setActiveTab] = useState('import');

  const tabs = [
    { id: 'import', label: '📥 Import Data', component: ImportManager },
    { id: 'viewData', label: '📊 View Data', component: MasterDataViewer },
    { id: 'currencies', label: 'Currencies', component: Currencies },
    { id: 'customerGroups', label: 'Customer Groups', component: CustomerGroups },
    { id: 'customerMappings', label: 'Customer Mappings', component: CustomerMappings },
    { id: 'fabCost', label: 'Fab Cost', component: FabCost },
    { id: 'standardPrices', label: 'Standard Prices', component: StandardPrices },
    { id: 'sellingFactors', label: 'Selling Factors', component: SellingFactors },
    { id: 'lmePrices', label: 'LME Prices', component: LmePrices },
    { id: 'exchangeRates', label: 'Exchange Rates', component: ExchangeRates },
    { id: 'activityLogs', label: 'Activity Logs', component: () => <ActivityLogs title="Activity Logs ทั้งหมด" /> },
  ];

  const renderContent = () => {
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    if (activeTabData) {
      const Component = activeTabData.component;
      return <Component key={activeTab} />;
    }
    return <div className="text-center py-8 text-slate-500">Select a category</div>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Master Data Management</h1>
          <p className="text-slate-600">Manage all master data for the pricing system.</p>
        </div>
      </div>
      
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs" style={{overflowX: 'auto'}}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default MasterData;