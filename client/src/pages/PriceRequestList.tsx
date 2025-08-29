import React, { useState, useEffect, useCallback } from 'react';

interface PriceRequest {
  id: string;
  customerName: string;
  productName: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  createdBy: string;
  createdAt: string;
  costingBy?: string; // NEW: Added optional field for costing user
}

interface PriceRequestListProps {
  onNavigate: (page: 'create-request') => void;
  onEdit: (requestId: string) => void;
}

// --- NEW: Context Menu Component ---
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
        View Details
      </a>
       <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
        Duplicate
      </a>
    </div>
  );
};


const PriceRequestList: React.FC<PriceRequestListProps> = ({ onNavigate, onEdit }) => {
  const [requests, setRequests] = useState<PriceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // --- NEW: State for Context Menu ---
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, requestId: string } | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('http://localhost:3000/mock-data/requests');
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setRequests(data);
      } catch (error) {
        console.error("Failed to fetch price requests:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // --- NEW: Handler for Context Menu ---
  const handleContextMenu = (event: React.MouseEvent, requestId: string) => {
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, requestId });
  };

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const getStatusBadge = (status: PriceRequest['status']) => {
    switch (status) {
      case 'Approved': return <span className="px-2.5 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Approved</span>;
      case 'Pending': return <span className="px-2.5 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full">Pending</span>;
      case 'Rejected': return <span className="px-2.5 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Rejected</span>;
      default: return null;
    }
  };

  if (isLoading) return <div>Loading requests...</div>;

  return (
    <div>
      {contextMenu && (
        <ContextMenu 
          x={contextMenu.x} 
          y={contextMenu.y} 
          onEdit={() => {
            onEdit(contextMenu.requestId);
            handleCloseContextMenu();
          }}
          onClose={handleCloseContextMenu}
        />
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Price Requests</h1>
          <p className="text-slate-500">Double-click or Right-click on a row for actions.</p>
        </div>
        <div>
          <button 
            onClick={() => onNavigate('create-request')}
            className="w-full sm:w-auto bg-blue-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700"
          >
            สร้างคำขอราคาใหม่
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3">Request ID</th>
                <th scope="col" className="px-6 py-3">ลูกค้า</th>
                <th scope="col" className="px-6 py-3 hidden lg:table-cell">Create Date</th>
                <th scope="col" className="px-6 py-3 hidden md:table-cell">ผู้สร้าง (Sales)</th>
                <th scope="col" className="px-6 py-3 hidden lg:table-cell">ผู้คิดราคา (Costing)</th>
                <th scope="col" className="px-6 py-3">สถานะ</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
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
