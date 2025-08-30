// path: client/src/pages/MasterData.tsx
// version: 3.1 (Enhanced Error Handling)
// last-modified: 29 สิงหาคม 2568 16:45

import React, { useState, useEffect, useCallback } from 'react';
import axios, { AxiosError } from 'axios';

// --- API Configuration ---
const api = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000, // 10 second timeout
});

// Add response interceptor to handle API responses consistently
api.interceptors.response.use(
  (response) => {
    // If backend uses ResponseInterceptor, extract data
    if (response.data?.success && response.data?.data !== undefined) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error: AxiosError) => {
    // Enhanced error handling
    if (error.response?.data) {
      const errorData = error.response.data as any;
      
      // Handle validation errors
      if (errorData.message && Array.isArray(errorData.message)) {
        error.message = errorData.message.join(', ');
      } else if (errorData.message) {
        error.message = errorData.message;
      }
    } else if (error.request) {
      error.message = 'Network error. Please check your connection.';
    } else {
      error.message = 'An unexpected error occurred.';
    }
    
    return Promise.reject(error);
  }
);

// --- Interfaces ---
interface MasterDataType {
  id?: string;
  [key: string]: any;
}

interface Column {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

interface MasterDataTableProps {
  title: string;
  endpoint: string;
  columns: Column[];
  canEdit?: boolean;
  canDelete?: boolean;
}

interface CustomerMapping {
  id?: string;
  customerId: string;
  customerName: string;
  customerGroupId: string;
  customerGroupName?: string;
}

// --- Enhanced Error Message Component ---
const ErrorMessage: React.FC<{ 
  message: string; 
  details?: string;
  onRetry?: () => void; 
  onDismiss?: () => void;
}> = ({ message, details, onRetry, onDismiss }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3 flex-1">
        <h3 className="text-sm font-medium text-red-800">Error</h3>
        <p className="mt-1 text-sm text-red-700">{message}</p>
        {details && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-red-600 hover:text-red-800">
              Show details
            </summary>
            <p className="mt-1 text-xs text-red-600 font-mono bg-red-100 p-2 rounded">
              {details}
            </p>
          </details>
        )}
      </div>
      <div className="ml-4 flex-shrink-0 flex space-x-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="bg-red-100 text-red-800 hover:bg-red-200 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Retry
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  </div>
);

// --- Loading Spinner Component ---
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
}> = ({ endpoint, value, onChange, placeholder = "Select...", displayKey = "name", disabled = false }) => {
  const [options, setOptions] = useState<MasterDataType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await api.get(`/mock-data/${endpoint}`);
        setOptions(response.data || []);
      } catch (err: any) {
        setError(err.message || `Failed to load ${endpoint}`);
        console.error('SearchableSelect fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, [endpoint]);

  if (loading) return <div className="text-sm text-slate-500 p-2.5">Loading options...</div>;
  
  if (error) {
    return (
      <div className="text-sm text-red-500 p-2.5 bg-red-50 border border-red-200 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full p-2.5 bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-200 disabled:cursor-not-allowed"
      required
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option[displayKey]} {option.id && `(${option.id})`}
        </option>
      ))}
    </select>
  );
};

// --- Enhanced Modal Component ---
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, children, maxWidth = "max-w-md" }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-xl ${maxWidth} w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none focus:outline-none"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- Enhanced Form Modal Component ---
const FormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>; // Changed to 'any' to handle both MasterDataType and CustomerMapping
  title: string;
  columns: Column[];
  editingItem: any | null; // Changed to 'any' to handle both types
}> = ({ isOpen, onClose, onSave, title, columns, editingItem }) => {
  const [formData, setFormData] = useState<any>({}); // Changed to 'any'
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Reset form when modal opens/closes or editingItem changes
  useEffect(() => {
    if (isOpen) {
      setFormData(editingItem || {});
      setErrors({});
      setSubmitError('');
    }
  }, [isOpen, editingItem]);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
    // Clear errors when user starts typing
    if (errors[key]) {
      setErrors((prev: { [key: string]: string }) => ({ ...prev, [key]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    columns.forEach(column => {
      const value = formData[column.key];
      if (column.required && (!value || !value.toString().trim())) {
        newErrors[column.key] = `${column.label} is required`;
      }
      
      // Additional validation for number fields
      if (column.type === 'number' && value) {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          newErrors[column.key] = `${column.label} must be a valid number`;
        } else if (numValue <= 0) {
          newErrors[column.key] = `${column.label} must be greater than 0`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (column: Column) => {
    const hasError = !!errors[column.key];
    const baseClasses = "w-full p-2.5 border text-slate-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 transition-colors";
    const errorClasses = hasError ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500" : "border-slate-300 bg-slate-50 focus:border-blue-500";
    
    if (column.options) {
      return (
        <select
          value={formData[column.key] || ''}
          onChange={e => handleInputChange(column.key, e.target.value)}
          className={`${baseClasses} ${errorClasses}`}
          disabled={isSubmitting}
          required={column.required}
        >
          <option value="">Select {column.label}</option>
          {column.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (column.key === 'customerGroupId' || column.key === 'customerId') {
      const endpoint = column.key === 'customerGroupId' ? 'customer-groups' : 'customers';
      return (
        <SearchableSelect
          endpoint={endpoint}
          value={formData[column.key] || ''}
          onChange={(value) => handleInputChange(column.key, value)}
          placeholder={`Select ${column.label}`}
          disabled={isSubmitting}
        />
      );
    }

    return (
      <input
        type={column.type || 'text'}
        value={formData[column.key] || ''}
        onChange={e => handleInputChange(column.key, e.target.value)}
        className={`${baseClasses} ${errorClasses}`}
        placeholder={`Enter ${column.label}`}
        disabled={isSubmitting}
        required={column.required}
        step={column.type === 'number' ? '0.01' : undefined}
        min={column.type === 'number' ? '0' : undefined}
      />
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Submit Error */}
        {submitError && (
          <ErrorMessage 
            message={submitError} 
            onDismiss={() => setSubmitError('')}
          />
        )}
        
        {/* Form Fields */}
        {columns.map(column => (
          <div key={column.key}>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {column.label} {column.required && <span className="text-red-500">*</span>}
            </label>
            {renderInput(column)}
            {errors[column.key] && (
              <p className="mt-1 text-sm text-red-600">{errors[column.key]}</p>
            )}
          </div>
        ))}
        
        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-slate-700 font-semibold bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-white font-semibold bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[100px] flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              editingItem ? 'Update' : 'Save'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// --- Enhanced Master Data Table Component ---
const MasterDataTable: React.FC<MasterDataTableProps> = ({ 
  title, 
  endpoint, 
  columns, 
  canEdit = true, 
  canDelete = true 
}) => {
  const [data, setData] = useState<MasterDataType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataType | null>(null);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get(`/mock-data/${endpoint}`);
      setData(response.data || []);
    } catch (err: any) {
      const errorMessage = err.message || `Failed to load ${title}. Please check your connection and try again.`;
      setError(errorMessage);
      console.error(`Failed to fetch ${endpoint}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, title]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-clear success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleOpenModal = (item: MasterDataType | null = null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (itemToSave: MasterDataType) => {
    try {
      if (itemToSave.id) {
        await api.put(`/mock-data/${endpoint}/${itemToSave.id}`, itemToSave);
        setSuccessMessage(`${title.slice(0, -1)} updated successfully!`);
      } else {
        await api.post(`/mock-data/${endpoint}`, itemToSave);
        setSuccessMessage(`${title.slice(0, -1)} created successfully!`);
      }
      await fetchData(); // Refresh data
    } catch (err: any) {
      throw err; // Let FormModal handle the error display
    }
  };

  const handleDelete = async (id: string, itemName?: string) => {
    const itemDescription = itemName ? `"${itemName}"` : `this ${title.toLowerCase().slice(0, -1)}`;
    
    if (!window.confirm(`Are you sure you want to delete ${itemDescription}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/mock-data/${endpoint}/${id}`);
      setSuccessMessage(`${title.slice(0, -1)} deleted successfully!`);
      await fetchData();
    } catch (err: any) {
      setError(err.message || `Failed to delete ${title.toLowerCase().slice(0, -1)}. Please try again.`);
    }
  };

  const formatCellValue = (value: any, key: string): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('factor')) {
        return value.toFixed(4);
      }
      if (key.toLowerCase().includes('price') || key.toLowerCase().includes('cost')) {
        return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      return value.toLocaleString();
    }
    return value.toString();
  };

  const getItemDisplayName = (item: MasterDataType): string => {
    return item.name || item.pattern || item.id || '';
  };

  if (isLoading) return <LoadingSpinner message={`Loading ${title.toLowerCase()}...`} />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-600 mt-1">
            {data.length} {data.length === 1 ? 'item' : 'items'} total
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          disabled={isLoading}
        >
          <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add New
        </button>
      </div>

      {/* Messages */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={fetchData}
          onDismiss={() => setError('')}
        />
      )}
      
      {successMessage && (
        <SuccessMessage 
          message={successMessage}
          onDismiss={() => setSuccessMessage('')}
        />
      )}

      {/* Data Table */}
      {data.length === 0 && !error ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H9a1 1 0 00-1 1v1m4 0h4m-4 0a1 1 0 01-1-1V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v1a1 1 0 01-1 1" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-900">No {title.toLowerCase()}</h3>
          <p className="mt-1 text-sm text-slate-500">Get started by creating your first {title.toLowerCase().slice(0, -1)}.</p>
          <div className="mt-6">
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add {title.slice(0, -1)}
            </button>
          </div>
        </div>
      ) : data.length > 0 ? (
        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {columns.map(column => (
                    <th 
                      key={column.key} 
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      {column.label}
                      {column.required && <span className="text-red-500 ml-1">*</span>}
                    </th>
                  ))}
                  {(canEdit || canDelete) && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {data.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50 transition-colors">
                    {columns.map(column => (
                      <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {formatCellValue(item[column.key], column.key)}
                      </td>
                    ))}
                    {(canEdit || canDelete) && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <button
                              onClick={() => handleOpenModal(item)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title={`Edit ${getItemDisplayName(item)}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(item.id!, getItemDisplayName(item))}
                              className="text-red-600 hover:text-red-900 transition-colors ml-2"
                              title={`Delete ${getItemDisplayName(item)}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        title={`${editingItem ? 'Edit' : 'Add'} ${title.slice(0, -1)}`}
        columns={columns}
        editingItem={editingItem}
      />
    </div>
  );
};

// --- Enhanced Customer Mapping Component ---
const CustomerMappingTable: React.FC = () => {
  const [data, setData] = useState<CustomerMapping[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomerMapping | null>(null);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  
  const [customers, setCustomers] = useState<MasterDataType[]>([]);
  const [customerGroups, setCustomerGroups] = useState<MasterDataType[]>([]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [mappingsRes, customersRes, groupsRes] = await Promise.all([
        api.get('/mock-data/customer-mappings'),
        api.get('/mock-data/customers'),
        api.get('/mock-data/customer-groups')
      ]);
      
      setData(mappingsRes.data || []);
      setCustomers(customersRes.data || []);
      setCustomerGroups(groupsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer mappings. Please try again.');
      console.error('Failed to fetch customer mappings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-clear success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleSave = async (itemToSave: CustomerMapping) => {
    try {
      // Add customer name for display
      const customer = customers.find(c => c.id === itemToSave.customerId);
      const group = customerGroups.find(g => g.id === itemToSave.customerGroupId);
      
      const mappingToSave = {
        ...itemToSave,
        customerName: customer?.name || '',
        customerGroupName: group?.name || ''
      };

      if (itemToSave.id) {
        await api.put(`/mock-data/customer-mappings/${itemToSave.id}`, mappingToSave);
        setSuccessMessage('Customer mapping updated successfully!');
      } else {
        await api.post('/mock-data/customer-mappings', mappingToSave);
        setSuccessMessage('Customer mapping created successfully!');
      }
      
      await fetchData();
    } catch (err: any) {
      throw err; // Let FormModal handle error display
    }
  };

  const handleDelete = async (id: string, customerName?: string) => {
    const itemDescription = customerName ? `mapping for "${customerName}"` : 'this customer mapping';
    
    if (!window.confirm(`Are you sure you want to delete ${itemDescription}?`)) {
      return;
    }

    try {
      await api.delete(`/mock-data/customer-mappings/${id}`);
      setSuccessMessage('Customer mapping deleted successfully!');
      await fetchData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete customer mapping. Please try again.');
    }
  };

  const mappingColumns: Column[] = [
    { key: 'customerId', label: 'Customer', required: true },
    { key: 'customerGroupId', label: 'Customer Group', required: true }
  ];

  if (isLoading) return <LoadingSpinner message="Loading customer mappings..." />;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Customer Mappings</h2>
          <p className="text-sm text-slate-600 mt-1">
            {data.length} {data.length === 1 ? 'mapping' : 'mappings'} total • Each customer can only be mapped to one group
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add New Mapping
        </button>
      </div>

      {/* Messages */}
      {error && (
        <ErrorMessage 
          message={error} 
          onRetry={fetchData}
          onDismiss={() => setError('')}
        />
      )}
      
      {successMessage && (
        <SuccessMessage 
          message={successMessage}
          onDismiss={() => setSuccessMessage('')}
        />
      )}

      {/* Data Table */}
      {data.length === 0 && !error ? (
        <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-slate-900">No customer mappings</h3>
          <p className="mt-1 text-sm text-slate-500">Get started by mapping your first customer to a pricing group.</p>
          <p className="mt-1 text-xs text-slate-400">Note: Each customer can only be mapped to one pricing group.</p>
          <div className="mt-6">
            <button
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Add Customer Mapping
            </button>
          </div>
        </div>
      ) : data.length > 0 ? (
        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Customer ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Customer Group
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {data.map(mapping => (
                  <tr key={mapping.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {mapping.customerId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      {mapping.customerName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {customerGroups.find(g => g.id === mapping.customerGroupId)?.name || mapping.customerGroupId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(mapping);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title={`Edit mapping for ${mapping.customerName}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(mapping.id!, mapping.customerName)}
                          className="text-red-600 hover:text-red-900 transition-colors ml-2"
                          title={`Delete mapping for ${mapping.customerName}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Form Modal */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        title={`${editingItem ? 'Edit' : 'Add'} Customer Mapping`}
        columns={mappingColumns}
        editingItem={editingItem}
      />
    </div>
  );
};

// --- Main MasterData Component ---
const MasterData: React.FC = () => {
  const [activeTab, setActiveTab] = useState('customerGroups');

  const tabs = [
    { id: 'customerGroups', label: 'Customer Groups', component: CustomerGroups },
    { id: 'customerMappings', label: 'Customer Mappings', component: CustomerMappings },
    { id: 'fabCost', label: 'Fab Cost', component: FabCost },
    { id: 'standardPrices', label: 'Standard Prices', component: StandardPrices },
    { id: 'sellingFactors', label: 'Selling Factors', component: SellingFactors },
    { id: 'lmePrices', label: 'LME Prices', component: LmePrices },
    { id: 'exchangeRates', label: 'Exchange Rates', component: ExchangeRates },
  ];

  const renderContent = () => {
    const activeTabData = tabs.find(tab => tab.id === activeTab);
    if (activeTabData) {
      const Component = activeTabData.component;
      return <Component key={activeTab} />; // Add key to force remount on tab change
    }
    return <div className="text-center py-8 text-slate-500">Select a category</div>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Master Data Management</h1>
          <p className="text-slate-600">Manage all master data for the pricing system.</p>
        </div>
      </div>
      
      {/* Tabs */}
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
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none focus:text-blue-600`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-8">
        {renderContent()}
      </div>
    </div>
  );
};

// --- Individual Tab Components ---
const CustomerGroups: React.FC = () => (
  <MasterDataTable
    title="Customer Groups"
    endpoint="customer-groups"
    columns={[
      { key: 'name', label: 'Group Name', required: true },
      { key: 'description', label: 'Description' },
      { 
        key: 'type', 
        label: 'Type', 
        required: true,
        options: [
          { value: 'Domestic', label: 'Domestic' },
          { value: 'Export', label: 'Export' }
        ]
      }
    ]}
  />
);

const CustomerMappings: React.FC = () => <CustomerMappingTable />;

const FabCost: React.FC = () => (
  <MasterDataTable
    title="Fab Costs"
    endpoint="fab-costs"
    columns={[
      { key: 'customerGroupId', label: 'Customer Group', required: true },
      { key: 'costValue', label: 'Cost Value', type: 'number', required: true },
      { 
        key: 'currency', 
        label: 'Currency', 
        required: true,
        options: [
          { value: 'THB', label: 'THB' },
          { value: 'USD', label: 'USD' },
          { value: 'EUR', label: 'EUR' }
        ]
      }
    ]}
  />
);

const StandardPrices: React.FC = () => (
  <MasterDataTable
    title="Standard Prices"
    endpoint="standard-prices"
    columns={[
      { key: 'rmId', label: 'RM ID', required: true },
      { key: 'price', label: 'Price', type: 'number', required: true },
      { 
        key: 'currency', 
        label: 'Currency', 
        required: true,
        options: [
          { value: 'THB', label: 'THB' },
          { value: 'USD', label: 'USD' },
          { value: 'EUR', label: 'EUR' }
        ]
      }
    ]}
    canEdit={false}
    canDelete={false}
  />
);

const SellingFactors: React.FC = () => (
  <MasterDataTable
    title="Selling Factors"
    endpoint="selling-factors"
    columns={[
      { key: 'pattern', label: 'Pattern', required: true },
      { key: 'factor', label: 'Factor', type: 'number', required: true }
    ]}
    canEdit={false}
    canDelete={false}
  />
);

const LmePrices: React.FC = () => (
  <MasterDataTable
    title="LME Prices"
    endpoint="lme-prices"
    columns={[
      { key: 'customerGroupId', label: 'Customer Group', required: true },
      { key: 'itemGroupCode', label: 'Item Group Code', required: true },
      { key: 'price', label: 'Price', type: 'number', required: true },
      { 
        key: 'currency', 
        label: 'Currency', 
        required: true,
        options: [
          { value: 'THB', label: 'THB' },
          { value: 'USD', label: 'USD' },
          { value: 'EUR', label: 'EUR' }
        ]
      }
    ]}
    canEdit={false}
    canDelete={false}
  />
);

const ExchangeRates: React.FC = () => (
  <MasterDataTable
    title="Exchange Rates"
    endpoint="exchange-rates"
    columns={[
      { key: 'customerGroupId', label: 'Customer Group', required: true },
      { 
        key: 'sourceCurrency', 
        label: 'Source Currency', 
        required: true,
        options: [
          { value: 'USD', label: 'USD' },
          { value: 'EUR', label: 'EUR' },
          { value: 'THB', label: 'THB' }
        ]
      },
      { 
        key: 'destinationCurrency', 
        label: 'Destination Currency', 
        required: true,
        options: [
          { value: 'THB', label: 'THB' },
          { value: 'USD', label: 'USD' },
          { value: 'EUR', label: 'EUR' }
        ]
      },
      { key: 'rate', label: 'Exchange Rate', type: 'number', required: true }
    ]}
  />
);

export default MasterData;