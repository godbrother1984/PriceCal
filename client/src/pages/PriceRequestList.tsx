// path: client/src/pages/PriceRequestList.tsx
// version: 2.5 (Fixed Display for New Customers/Products)
// last-modified: 1 กันยายน 2568

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// --- API Configuration ---
const api = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
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
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// --- Interfaces ---
interface PriceRequest {
  id: string;
  customerName: string;
  productName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdBy: string;
  createdAt: string;
  costingBy?: string;
  customerType?: 'existing' | 'new';
  productType?: 'existing' | 'new';
}

interface PriceRequestListProps {
  onNavigate: (page: string) => void;
  onEdit: (requestId: string) => void;
  onViewPricing?: (requestId: string) => void;
  version: number;
}

// --- Components ---
const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-slate-600">Loading...</span>
  </div>
);

const ContextMenu: React.FC<{ 
  x: number; 
  y: number; 
  onEdit: () => void; 
  onViewPricing?: () => void;
  onClose: () => void;
}> = ({ x, y, onEdit, onViewPricing, onClose }) => {
  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [onClose]);

  return (
    <div 
      className="fixed bg-white border border-slate-200 rounded-lg shadow-lg py-2 z-50"
      style={{ left: x, top: y }}
    >
      <button 
        onClick={onEdit}
        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Request
      </button>
      {onViewPricing && (
        <button 
          onClick={onViewPricing}
          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          View Pricing
        </button>
      )}
    </div>
  );
};

const ErrorMessage: React.FC<{ 
  message: string; 
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
    <p className="text-red-700 mb-2">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="text-red-600 hover:text-red-800 underline text-sm">
        Try Again
      </button>
    )}
  </div>
);

const PriceRequestList: React.FC<PriceRequestListProps> = ({ onNavigate, onEdit, onViewPricing, version }) => {
  const [requests, setRequests] = useState<PriceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);

  // Helper function to extract data from API response
  const extractApiData = (response: any): PriceRequest[] => {
    if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    }
    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    console.warn('Unexpected API response format:', response);
    return [];
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/mock-data/requests');
      
      console.log('[PriceRequestList] API Response:', response.data);
      
      const requestsData = extractApiData(response.data);
      
      // Map data to ensure we show correct names for new customers/products
      const formattedRequests = requestsData.map(req => ({
        ...req,
        customerName: req.customerName || 'Unknown Customer',
        productName: req.productName || 'Unknown Product'
      }));
      
      setRequests(formattedRequests);

      console.log('[PriceRequestList] Loaded requests:', formattedRequests.length);

    } catch (err: any) {
      console.error('[PriceRequestList] Fetch error:', err);
      setError(err.message || 'Could not load price requests. Please check your connection.');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, version]);

  // Safe filtering with array validation
  const filteredRequests = Array.isArray(requests) 
    ? requests.filter(req => filter === 'All' || req.status === filter)
    : [];

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'Approved':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Approved</span>;
      case 'Rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Rejected</span>;
      case 'Pending':
      default:
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
    }
  };

  const getCustomerDisplay = (req: PriceRequest) => {
    if (req.customerType === 'new') {
      return (
        <div>
          <span className="font-medium">{req.customerName}</span>
          <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">New</span>
        </div>
      );
    }
    return req.customerName;
  };

  const getProductDisplay = (req: PriceRequest) => {
    if (req.productType === 'new') {
      return (
        <div>
          <span className="font-medium">{req.productName}</span>
          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">New</span>
        </div>
      );
    }
    return req.productName;
  };

  const getStatusCount = (status: string): number => {
    if (!Array.isArray(requests)) return 0;
    return status === 'All' ? requests.length : requests.filter(r => r.status === status).length;
  };

  const handleContextMenu = (e: React.MouseEvent, requestId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id: requestId });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const tabs = ['All', 'Pending', 'Approved', 'Rejected'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Price Requests</h1>
          <p className="text-slate-600">ติดตามและจัดการคำขอราคาทั้งหมด</p>
        </div>
        
        <button 
          onClick={() => onNavigate('create-request')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Request
        </button>
      </div>

      {/* Tabs/Filter */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`${
                  filter === tab
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                {tab} ({getStatusCount(tab)})
              </button>
            ))}
          </nav>
        </div>
        
        {/* Content */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-center py-8">
            <ErrorMessage message={error} onRetry={fetchRequests} />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">
              {filter === 'All' ? 'No price requests' : `No ${filter.toLowerCase()} requests`}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {filter === 'All' 
                ? 'Get started by creating your first price request.' 
                : `There are no ${filter.toLowerCase()} requests at the moment.`
              }
            </p>
            {filter === 'All' && (
              <div className="mt-6">
                <button 
                  onClick={() => onNavigate('create-request')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Create Price Request
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Request ID</th>
                  <th scope="col" className="px-6 py-3">Customer</th>
                  <th scope="col" className="px-6 py-3 hidden lg:table-cell">Product</th>
                  <th scope="col" className="px-6 py-3 hidden lg:table-cell">Created Date</th>
                  <th scope="col" className="px-6 py-3 hidden md:table-cell">Created By</th>
                  <th scope="col" className="px-6 py-3 hidden lg:table-cell">Costing By</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(req => (
                  <tr 
                    key={req.id} 
                    className="bg-white border-b hover:bg-slate-50 cursor-pointer transition-colors"
                    onDoubleClick={() => onEdit(req.id)}
                    onContextMenu={(e) => handleContextMenu(e, req.id)}
                  >
                    <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                      {req.id}
                      <div className="font-normal text-slate-500 md:hidden">
                        {getProductDisplay(req)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900">
                      {getCustomerDisplay(req)}
                      <div className="text-slate-500 text-xs sm:hidden">
                        {req.createdAt} • {req.createdBy}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-slate-900">
                      {getProductDisplay(req)}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-slate-600">
                      {req.createdAt}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell text-slate-600">
                      {req.createdBy}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-slate-600">
                      {req.costingBy || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(req.id);
                          }} 
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                          title={`Edit request ${req.id}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        
                        {/* Pricing Button */}
                        {onViewPricing && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewPricing(req.id);
                            }} 
                            className="text-green-600 hover:text-green-800 transition-colors p-1"
                            title={`View pricing for ${req.id}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            onEdit(contextMenu.id);
            closeContextMenu();
          }}
          onViewPricing={onViewPricing ? () => {
            onViewPricing(contextMenu.id);
            closeContextMenu();
          } : undefined}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
};

export default PriceRequestList;