// path: client/src/pages/PriceRequestList.tsx
// version: 2.0
// last-modified: 29 สิงหาคม 2568 14:25

import React, { useState, useEffect, useCallback } from 'react';

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
  version: number; // (เพิ่ม) รับ version มาจาก MainLayout
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
      <a href="#" onClick={onEdit} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
        Edit Request
      </a>
      <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
        View History
      </a>
      <div className="my-1 border-t border-slate-100"></div>
      <a href="#" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">
        Cancel Request
      </a>
    </div>
  );
};

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
      const response = await fetch('http://localhost:3000/mock-data/requests');
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError('Could not load price requests.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // (แก้ไข) เพิ่ม version เข้าไปใน dependency array
  // ทำให้ useEffect นี้ทำงานใหม่ทุกครั้งที่ค่า version เปลี่ยน
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests, version]);

  const filteredRequests = requests.filter(req => filter === 'All' || req.status === filter);

  const getStatusBadge = (status: PriceRequest['status']) => {
    const styles = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{status}</span>;
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, id });
  };
  
  const closeContextMenu = useCallback(() => setContextMenu(null), []);

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
        <button onClick={() => onNavigate('create-request')} className="w-full sm:w-auto mt-4 sm:mt-0 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
          + New Price Request
        </button>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 mb-4">
          <nav className="-mb-px flex space-x-6">
            {['All', 'Pending', 'Approved', 'Rejected'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setFilter(tab)}
                className={`${filter === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3">Request ID</th>
                <th scope="col" className="px-6 py-3">Customer</th>
                <th scope="col" className="px-6 py-3 hidden lg:table-cell">Created Date</th>
                <th scope="col" className="px-6 py-3 hidden md:table-cell">Created By</th>
                <th scope="col" className="px-6 py-3 hidden lg:table-cell">Costing By</th>
                <th scope="col" className="px-6 py-3">Status</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center p-8">Loading...</td></tr>}
              {error && <tr><td colSpan={7} className="text-center p-8 text-red-500">{error}</td></tr>}
              {!loading && !error && filteredRequests.map(req => (
                <tr 
                  key={req.id} 
                  className="bg-white border-b hover:bg-slate-50 cursor-pointer"
                  onDoubleClick={() => onEdit(req.id)}
                  onContextMenu={(e) => handleContextMenu(e, req.id)}
                >
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                    {req.id}
                    <div className="font-normal text-slate-500 md:hidden">{req.productName}</div>
                  </td>
                  <td className="px-6 py-4">{req.customerName}</td>
                  <td className="px-6 py-4 hidden lg:table-cell">{req.createdAt}</td>
                  <td className="px-6 py-4 hidden md:table-cell">{req.createdBy}</td>
                  <td className="px-6 py-4 hidden lg:table-cell">{req.costingBy || '-'}</td>
                  <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={(e) => {
                      e.stopPropagation(); // Prevent row's onDoubleClick from firing
                      onEdit(req.id);
                    }} className="text-blue-600 hover:text-blue-800 font-medium">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PriceRequestList;
