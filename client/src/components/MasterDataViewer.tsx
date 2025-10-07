// path: client/src/components/MasterDataViewer.tsx
// version: 1.0 (Master Data Viewer - View Imported Data)
// last-modified: 1 ตุลาคม 2568 11:45

import React, { useState, useEffect } from 'react';

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  category: string;
  description?: string;
  isActive: boolean;
  sourceSystem?: string;
  lastSyncedAt?: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  isActive: boolean;
  sourceSystem?: string;
  lastSyncedAt?: string;
}

interface Customer {
  id: string;
  name: string;
  taxId?: string;
  email?: string;
  phone?: string;
  address?: string;
  customerGroupId?: string;
  isActive: boolean;
  sourceSystem?: string;
  lastSyncedAt?: string;
}

type DataType = 'rawMaterials' | 'finishedGoods' | 'customers' | 'employees';

const MasterDataViewer: React.FC = () => {
  const [selectedType, setSelectedType] = useState<DataType>('rawMaterials');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [selectedType]);

  const loadData = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      switch (selectedType) {
        case 'rawMaterials':
          endpoint = 'http://localhost:3001/api/data/raw-materials';
          break;
        case 'finishedGoods':
          endpoint = 'http://localhost:3001/api/data/products';
          break;
        case 'customers':
          endpoint = 'http://localhost:3001/api/data/customers';
          break;
        case 'employees':
          // TODO: Create employees endpoint
          endpoint = 'http://localhost:3001/api/data/employees';
          break;
      }

      const response = await fetch(endpoint);
      const result = await response.json();

      if (result.success) {
        setData(result.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSource =
      filterSource === 'all' || item.sourceSystem === filterSource;

    return matchesSearch && matchesSource;
  });

  const uniqueSources = Array.from(
    new Set(data.map((item) => item.sourceSystem).filter(Boolean))
  );

  const getSourceBadgeColor = (source?: string) => {
    switch (source) {
      case 'D365':
        return 'bg-blue-100 text-blue-800';
      case 'Manual':
        return 'bg-green-100 text-green-800';
      case 'Import':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📊 View Master Data</h3>
        <p className="text-sm text-slate-600">
          ดูและจัดการข้อมูล Master Data ที่นำเข้าจาก API หรือเพิ่มด้วยตนเอง
        </p>
      </div>

      {/* Data Type Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setSelectedType('rawMaterials')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedType === 'rawMaterials'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="text-2xl mb-2">🔧</div>
            <div className="font-semibold text-sm">Raw Materials</div>
            <div className="text-xs text-slate-500 mt-1">
              {data.filter((d) => selectedType === 'rawMaterials').length} รายการ
            </div>
          </button>

          <button
            onClick={() => setSelectedType('finishedGoods')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedType === 'finishedGoods'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="font-semibold text-sm">Finished Goods</div>
            <div className="text-xs text-slate-500 mt-1">
              {data.filter((d) => selectedType === 'finishedGoods').length} รายการ
            </div>
          </button>

          <button
            onClick={() => setSelectedType('customers')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedType === 'customers'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="text-2xl mb-2">🏢</div>
            <div className="font-semibold text-sm">Customers</div>
            <div className="text-xs text-slate-500 mt-1">
              {data.filter((d) => selectedType === 'customers').length} รายการ
            </div>
          </button>

          <button
            onClick={() => setSelectedType('employees')}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedType === 'employees'
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-blue-300'
            }`}
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="font-semibold text-sm">Employees</div>
            <div className="text-xs text-slate-500 mt-1">0 รายการ</div>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              🔍 ค้นหา
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาด้วย ID หรือชื่อ..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              📍 แหล่งที่มา
            </label>
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">ทั้งหมด</option>
              {uniqueSources.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="text-sm text-slate-600">
            แสดง <span className="font-semibold">{filteredData.length}</span> จาก{' '}
            <span className="font-semibold">{data.length}</span> รายการ
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors text-sm"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600">Loading data...</span>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <div className="text-4xl mb-3">📭</div>
            <div className="font-medium">ไม่พบข้อมูล</div>
            <div className="text-sm mt-1">
              {searchTerm || filterSource !== 'all'
                ? 'ลองเปลี่ยนเงื่อนไขการค้นหา'
                : 'ยังไม่มีข้อมูลในระบบ กรุณา Import ข้อมูลก่อน'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Name
                  </th>
                  {selectedType === 'rawMaterials' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Unit
                      </th>
                    </>
                  )}
                  {selectedType === 'finishedGoods' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Category
                    </th>
                  )}
                  {selectedType === 'customers' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Phone
                      </th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Last Synced
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredData.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {item.name}
                    </td>
                    {selectedType === 'rawMaterials' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {item.category || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {item.unit || '-'}
                        </td>
                      </>
                    )}
                    {selectedType === 'finishedGoods' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {item.category || '-'}
                      </td>
                    )}
                    {selectedType === 'customers' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {item.email || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {item.phone || '-'}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceBadgeColor(
                          item.sourceSystem
                        )}`}
                      >
                        {item.sourceSystem || 'Manual'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {formatDate(item.lastSyncedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {!loading && data.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="font-semibold text-slate-800 mb-4">📈 สถิติข้อมูล</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Total</div>
              <div className="text-2xl font-bold text-blue-900">{data.length}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Active</div>
              <div className="text-2xl font-bold text-green-900">
                {data.filter((d) => d.isActive).length}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">From API</div>
              <div className="text-2xl font-bold text-purple-900">
                {data.filter((d) => d.sourceSystem === 'D365').length}
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 font-medium">Manual</div>
              <div className="text-2xl font-bold text-orange-900">
                {data.filter((d) => !d.sourceSystem || d.sourceSystem === 'Manual').length}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterDataViewer;
