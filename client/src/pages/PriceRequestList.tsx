import React, { useState, useEffect } from 'react';

interface PriceRequest {
  id: string;
  customerName: string;
  productName: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  createdBy: string;
  createdAt: string;
}

interface PriceRequestListProps {
  onNavigate: (page: 'create-request') => void;
  onEdit: (requestId: string) => void; // NEW: Prop to handle editing
}

const PriceRequestList: React.FC<PriceRequestListProps> = ({ onNavigate, onEdit }) => {
  const [requests, setRequests] = useState<PriceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await fetch('http://localhost:3000/mock-data/requests');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
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

  const getStatusBadge = (status: PriceRequest['status']) => {
    switch (status) {
      case 'Approved':
        return <span className="px-2.5 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Approved</span>;
      case 'Pending':
        return <span className="px-2.5 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full">Pending</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Rejected</span>;
      default:
        return null;
    }
  };

  if (isLoading) return <div>Loading requests...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Price Requests</h1>
          <p className="text-slate-500">จัดการและติดตามสถานะคำขอราคา</p>
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
                <th scope="col" className="px-6 py-3 hidden md:table-cell">ผู้สร้าง</th>
                <th scope="col" className="px-6 py-3">สถานะ</th>
                <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                    {req.id}
                    <div className="font-normal text-slate-500 md:hidden">{req.productName}</div>
                  </td>
                  <td className="px-6 py-4">{req.customerName}</td>
                  <td className="px-6 py-4 hidden md:table-cell">{req.createdBy}</td>
                  <td className="px-6 py-4">{getStatusBadge(req.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onEdit(req.id)} className="text-blue-600 hover:text-blue-800 font-medium">
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
