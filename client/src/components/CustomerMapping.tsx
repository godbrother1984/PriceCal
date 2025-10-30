// path: client/src/components/CustomerMapping.tsx
// version: 1.0 (Customer to Group Mapping Component)
// last-modified: 29 ตุลาคม 2568 18:25

import React, { useState, useEffect } from 'react';
import { customerMappingAPI } from '../services/api';

interface CustomerMappingProps {
  groupId: string;
}

interface Customer {
  id: string;
  name: string;
  code?: string;
  [key: string]: any;
}

const CustomerMapping: React.FC<CustomerMappingProps> = ({ groupId }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [customerId, setCustomerId] = useState('');

  useEffect(() => {
    loadCustomers();
  }, [groupId]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await customerMappingAPI.getCustomersByGroup(groupId);
      setCustomers(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId.trim()) {
      alert('กรุณาระบุ Customer ID');
      return;
    }

    try {
      await customerMappingAPI.addCustomerToGroup(groupId, customerId.trim());
      await loadCustomers();
      setIsAdding(false);
      setCustomerId('');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRemoveCustomer = async (custId: string) => {
    if (!confirm('ต้องการลบลูกค้าออกจากกลุ่มนี้ใช่หรือไม่?')) return;

    try {
      await customerMappingAPI.removeCustomerFromGroup(groupId, custId);
      await loadCustomers();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return <div className="text-center py-8">กำลังโหลด...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">ลูกค้าในกลุ่ม ({customers.length} ราย)</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + เพิ่มลูกค้า
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Add Customer Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">เพิ่มลูกค้าเข้ากลุ่ม</h4>
            <form onSubmit={handleAddCustomer}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer ID
                </label>
                <input
                  type="text"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  placeholder="เช่น CUST-001"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  ระบุ Customer ID ที่ต้องการเพิ่มเข้ากลุ่ม
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setCustomerId('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  เพิ่ม
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer List */}
      <div className="space-y-2">
        {customers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <div>ยังไม่มีลูกค้าในกลุ่มนี้</div>
            <div className="text-sm mt-2">กดปุ่ม "+ เพิ่มลูกค้า" เพื่อเพิ่มลูกค้าเข้ากลุ่ม</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="border border-gray-200 rounded p-4 hover:bg-gray-50 flex justify-between items-start"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    {customer.name || customer.id}
                  </div>
                  {customer.code && (
                    <div className="text-sm text-gray-500">Code: {customer.code}</div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">ID: {customer.id}</div>
                </div>
                <button
                  onClick={() => handleRemoveCustomer(customer.id)}
                  className="text-red-600 hover:text-red-700 text-sm ml-2"
                >
                  ลบ
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <div className="flex items-start">
          <div className="text-blue-600 mr-2">ℹ️</div>
          <div className="text-sm text-blue-800">
            <strong>หมายเหตุ:</strong> ลูกค้าในกลุ่มนี้จะใช้ราคาที่กำหนดใน Override แทนราคาจาก Master Data
            หากไม่มี Override สำหรับรายการใด ระบบจะใช้ราคาจาก Master Data โดยอัตโนมัติ
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerMapping;
