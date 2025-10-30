// path: client/src/pages/CustomerGroups.tsx
// version: 3.0 (Complete Phase 2 Frontend - All Components Integrated)
// last-modified: 29 ตุลาคม 2568 18:30

import React, { useState, useEffect } from 'react';
import { customerGroupsAPI, customerMappingAPI, overrideAPI } from '../services/api';
import OverrideManager from '../components/OverrideManager';
import CustomerMapping from '../components/CustomerMapping';

interface CustomerGroup {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

type Tab = 'groups' | 'customers' | 'fab-cost' | 'selling-factor' | 'lme-price' | 'exchange-rate' | 'standard-price';

const CustomerGroups: React.FC = () => {
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<CustomerGroup | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('groups');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    isDefault: false,
    isActive: true,
  });

  // Load customer groups
  useEffect(() => {
    loadCustomerGroups();
  }, []);

  const loadCustomerGroups = async () => {
    try {
      setLoading(true);
      const data = await customerGroupsAPI.getAll();
      setCustomerGroups(data);

      // Auto-select first group
      if (data.length > 0 && !selectedGroup) {
        setSelectedGroup(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await customerGroupsAPI.create(formData);
      await loadCustomerGroups();
      setIsCreating(false);
      setFormData({ id: '', name: '', description: '', isDefault: false, isActive: true });
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdate = async (group: CustomerGroup) => {
    try {
      await customerGroupsAPI.update(group.id, group);
      await loadCustomerGroups();
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณต้องการลบกลุ่มลูกค้านี้หรือไม่?')) return;

    try {
      await customerGroupsAPI.delete(id);
      await loadCustomerGroups();
      if (selectedGroup?.id === id) {
        setSelectedGroup(null);
      }
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="p-6 h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">จัดการกลุ่มลูกค้า</h1>
        <p className="text-gray-600">
          กำหนดราคาพิเศษสำหรับกลุ่มลูกค้าเฉพาะ (Customer Group Override System)
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Left Sidebar - Customer Groups List */}
        <div className="w-80 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-800">รายการกลุ่มลูกค้า</h2>
              <button
                onClick={() => setIsCreating(true)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                + สร้างกลุ่มใหม่
              </button>
            </div>
            <div className="text-sm text-gray-500">
              ทั้งหมด {customerGroups.length} กลุ่ม
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {customerGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => {
                  setSelectedGroup(group);
                  setActiveTab('groups');
                }}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors ${
                  selectedGroup?.id === group.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{group.name}</div>
                    <div className="text-sm text-gray-500 truncate">{group.id}</div>
                  </div>
                  {group.isDefault && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      Default
                    </span>
                  )}
                </div>
                {group.description && (
                  <div className="mt-1 text-sm text-gray-600 line-clamp-2">{group.description}</div>
                )}
              </div>
            ))}

            {customerGroups.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <div>ยังไม่มีกลุ่มลูกค้า</div>
                <div className="text-sm">กดปุ่มด้านบนเพื่อสร้างกลุ่มใหม่</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Group Details & Tabs */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          {selectedGroup ? (
            <>
              {/* Group Header */}
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedGroup.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">ID: {selectedGroup.id}</p>
                    {selectedGroup.description && (
                      <p className="text-gray-600 mt-2">{selectedGroup.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {selectedGroup.isDefault && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                        กลุ่มเริ่มต้น
                      </span>
                    )}
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      selectedGroup.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedGroup.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 bg-gray-50">
                <nav className="flex space-x-1 p-2 overflow-x-auto">
                  {[
                    { id: 'groups' as Tab, label: 'ข้อมูลกลุ่ม', icon: '📋' },
                    { id: 'customers' as Tab, label: 'ลูกค้าในกลุ่ม', icon: '👥' },
                    { id: 'fab-cost' as Tab, label: 'FAB Cost', icon: '🔧' },
                    { id: 'selling-factor' as Tab, label: 'Selling Factor', icon: '💰' },
                    { id: 'lme-price' as Tab, label: 'LME Price', icon: '📊' },
                    { id: 'exchange-rate' as Tab, label: 'Exchange Rate', icon: '💱' },
                    { id: 'standard-price' as Tab, label: 'Standard Price', icon: '💲' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:bg-white hover:text-gray-800'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'groups' && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">ข้อมูลกลุ่มลูกค้า</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          รหัสกลุ่ม (ID)
                        </label>
                        <input
                          type="text"
                          value={selectedGroup.id}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ชื่อกลุ่ม
                        </label>
                        <input
                          type="text"
                          value={selectedGroup.name}
                          onChange={(e) =>
                            setSelectedGroup({ ...selectedGroup, name: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          คำอธิบาย
                        </label>
                        <textarea
                          value={selectedGroup.description || ''}
                          onChange={(e) =>
                            setSelectedGroup({ ...selectedGroup, description: e.target.value })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedGroup.isDefault}
                            onChange={(e) =>
                              setSelectedGroup({ ...selectedGroup, isDefault: e.target.checked })
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">กลุ่มเริ่มต้น</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedGroup.isActive}
                            onChange={(e) =>
                              setSelectedGroup({ ...selectedGroup, isActive: e.target.checked })
                            }
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">ใช้งาน</span>
                        </label>
                      </div>

                      <div className="flex gap-2 pt-4">
                        <button
                          onClick={() => handleUpdate(selectedGroup)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                          บันทึกการเปลี่ยนแปลง
                        </button>
                        <button
                          onClick={() => handleDelete(selectedGroup.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                        >
                          ลบกลุ่ม
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'customers' && (
                  <CustomerMapping groupId={selectedGroup.id} />
                )}

                {['fab-cost', 'selling-factor', 'lme-price', 'exchange-rate', 'standard-price'].includes(activeTab) && (
                  <OverrideManager
                    groupId={selectedGroup.id}
                    type={activeTab as 'fab-cost' | 'selling-factor' | 'lme-price' | 'exchange-rate' | 'standard-price'}
                  />
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="text-6xl mb-4">📋</div>
                <div className="text-xl">เลือกกลุ่มลูกค้าจากรายการด้านซ้าย</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">สร้างกลุ่มลูกค้าใหม่</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสกลุ่ม (ID) *
                </label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น GROUP_VIP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อกลุ่ม *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น ลูกค้า VIP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  คำอธิบาย
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="อธิบายเกี่ยวกับกลุ่มนี้"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">กลุ่มเริ่มต้น</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">ใช้งาน</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  สร้างกลุ่ม
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setFormData({ id: '', name: '', description: '', isDefault: false, isActive: true });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerGroups;
