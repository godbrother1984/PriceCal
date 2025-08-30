// path: client/src/pages/PriceRequestList.tsx
// version: 3.0 (Fixed Backend Response Handling)
// last-modified: 29 สิงหาคม 2568 17:20

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

interface PriceRequest {
  id: string;
  customerName: string;
  productName: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  createdBy: string;
  createdAt: string;
  costingBy?: string;
}

interface PriceRequestListProps {
  onNavigate: (page: 'create-request') => void;
  onEdit: (requestId: string) => void;
  version: number;
}

const ContextMenu = ({ x, y, onEdit, onClose }: { x: number, y: number, onEdit: () => void, onClose: () => void }) => {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div 
      style={{ top: y, left: x }} 
      className="absolute z-50 bg-white rounded-md shadow-lg border border-slate-200 w-48 py-1"
    >
      <button onClick={onEdit} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
        Edit Request
      </button>
      <button className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
        View History
      </button>
      <div className="my-1 border-t border-slate-100"></div>
      <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
        Cancel Request
      </button>
    </div>
  );
};

const LoadingSpinner: React.FC = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
  </div>
);

const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
    <p className="text-red-700 mb-2">{message}</p>
    {onRetry && (
      <button onClick={onRetry} className="text-red-600 hover:text-red-800 underline text-sm">
        Try Again
      </button>
    )}
  </div>
);

const PriceRequestList: React.FC<PriceRequestListProps> = ({ onNavigate, onEdit, version }) => {
  const [requests, setRequests] = useState<PriceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/mock-data/requests');
      
      // Enhanced data validation
      const data = response.data;
      console.log('API Response:', data); // Debug log
      
      if (Array.isArray(data)) {
        setRequests(data);
      } else if (data && typeof data === 'object' && Array.isArray(data.data)) {
        // Handle nested data structure
        setRequests(data.data);
      } else {
        console.error('Unexpected response format:', data);
        setRequests([]);
        setError('Received unexpected data format from server');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      setError(err.message || 'Could not load price requests. Please check your connection.');
      setRequests([]); // Ensure requests is always an array
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

  const getStatusBadge = (status: PriceRequest['status']) => {
    const styles = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  };
  
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  // Get status counts for tab display
  const getStatusCount = (status: string) => {
    if (!Array.isArray(requests)) return 0;
    if (status === 'All') return requests.length;
    return requests.filter(req => req.status === status).length;
  };

  return (
    <div>
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          onEdit={() => {
            onEdit(contextMenu.id);
            closeContextMenu();
          }}
          onClose={closeContextMenu}
        />
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Price Requests</h1>
          <p className="text-slate-500 mt-1">รายการคำขอราคาทั้งหมด</p>
        </div>
        <button 
          onClick={() => onNavigate('create-request')} 
          className="w-full sm:w-auto mt-4 sm:mt-0 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors"
        >
          + New Price Request
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6">
          <ErrorMessage message={error} onRetry={fetchRequests} />
        </div>
      )}

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
        {/* Filter Tabs */}
        <div className="border-b border-slate-200 mb-4">
          <nav className="-mb-px flex space-x-6">
            {['All', 'Pending', 'Approved', 'Rejected'].map(tab => (
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
                        {req.productName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900">
                      {req.customerName}
                      <div className="text-slate-500 text-xs sm:hidden">
                        {req.createdAt} • {req.createdBy}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-slate-900">
                      {req.productName}
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
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(req.id);
                        }} 
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        title={`Edit request ${req.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="sr-only">Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceRequestList;