// path: client/src/components/ApiSettings.tsx
// version: 2.0 (Add MongoDB Support)
// last-modified: 1 ตุลาคม 2568 15:25

import React, { useState, useEffect } from 'react';

interface ApiSetting {
  apiType: 'RAW_MATERIALS' | 'FINISHED_GOODS' | 'EMPLOYEES' | 'CUSTOMERS';
  name: string;
  url: string;
  description?: string;
  authType: 'none' | 'bearer' | 'basic' | 'api-key';
  authToken?: string;
  authUsername?: string;
  authPassword?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  dataSource?: 'REST_API' | 'MONGODB';
  mongoCollection?: string;
  mongoQuery?: string;
  isActive: boolean;
  lastSyncedAt?: string;
  lastSyncStatus?: string;
  lastSyncMessage?: string;
}

const API_TYPES = [
  { value: 'RAW_MATERIALS', label: 'Raw Materials (วัตถุดิบ)', icon: '🔧' },
  { value: 'FINISHED_GOODS', label: 'Finished Goods (สินค้าสำเร็จรูป)', icon: '📦' },
  { value: 'EMPLOYEES', label: 'Employees (พนักงาน)', icon: '👥' },
  { value: 'CUSTOMERS', label: 'Customers (ลูกค้า)', icon: '🏢' },
];

const AUTH_TYPES = [
  { value: 'none', label: 'No Authentication' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'api-key', label: 'API Key' },
  { value: 'basic', label: 'Basic Auth (Username/Password)' },
];

const ApiSettings: React.FC = () => {
  const [settings, setSettings] = useState<ApiSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ApiSetting>>({});
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/api-settings');
      const data = await response.json();

      if (data.success) {
        setSettings(data.data || []);
      }
    } catch (error) {
      console.error('Error loading API settings:', error);
      showMessage('error', 'Failed to load API settings');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleEdit = (setting: ApiSetting) => {
    setEditingType(setting.apiType);
    setFormData(setting);
  };

  const handleNew = (apiType: string) => {
    const typeInfo = API_TYPES.find(t => t.value === apiType);
    setEditingType(apiType);
    setFormData({
      apiType: apiType as any,
      name: typeInfo?.label || '',
      url: '',
      authType: 'none',
      dataSource: 'REST_API',
      isActive: true,
      headers: {},
      queryParams: {},
    });
  };

  const handleCancel = () => {
    setEditingType(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!formData.apiType || !formData.url) {
      showMessage('error', 'Please fill in required fields');
      return;
    }

    setSaveLoading(true);

    try {
      const existingSetting = settings.find(s => s.apiType === formData.apiType);
      const method = existingSetting ? 'PUT' : 'POST';
      const url = existingSetting
        ? `http://localhost:3001/api/api-settings/${formData.apiType}`
        : 'http://localhost:3001/api/api-settings';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', existingSetting ? 'API setting updated' : 'API setting created');
        await loadSettings();
        handleCancel();
      } else {
        showMessage('error', data.message || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving API setting:', error);
      showMessage('error', 'Failed to save API setting');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (apiType: string) => {
    if (!confirm(`Are you sure you want to delete ${apiType} API settings?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/api-settings/${apiType}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        showMessage('success', 'API setting deleted');
        await loadSettings();
      } else {
        showMessage('error', 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting API setting:', error);
      showMessage('error', 'Failed to delete API setting');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">API Settings</h3>
        <p className="text-sm text-gray-600">
          กำหนด API endpoints สำหรับดึงข้อมูล master data จากระบบภายนอก (เช่น D365)
        </p>
      </div>

      {/* API Settings List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {API_TYPES.map(type => {
          const setting = settings.find(s => s.apiType === type.value);
          const isEditing = editingType === type.value;

          if (isEditing) {
            return (
              <div key={type.value} className="bg-white rounded-lg shadow p-6 col-span-full">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <span>{type.icon}</span>
                    {type.label}
                  </h4>
                  <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Data Source */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Source <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.dataSource || 'REST_API'}
                      onChange={(e) => setFormData({ ...formData, dataSource: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="REST_API">REST API</option>
                      <option value="MONGODB">MongoDB</option>
                    </select>
                  </div>

                  {/* REST API Fields */}
                  {formData.dataSource !== 'MONGODB' && (
                    <>
                      {/* URL */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          API URL <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="url"
                          value={formData.url || ''}
                          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://api.example.com/inventory/raw-materials"
                        />
                      </div>
                    </>
                  )}

                  {/* MongoDB Fields */}
                  {formData.dataSource === 'MONGODB' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          MongoDB Collection <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.mongoCollection || ''}
                          onChange={(e) => setFormData({ ...formData, mongoCollection: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="raw_materials"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          MongoDB Query (JSON)
                        </label>
                        <textarea
                          value={formData.mongoQuery || ''}
                          onChange={(e) => setFormData({ ...formData, mongoQuery: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                          rows={3}
                          placeholder='{"status": "active", "isDeleted": false}'
                        />
                        <p className="text-xs text-gray-500 mt-1">ระบุ MongoDB query เป็น JSON (ไม่ระบุ = ดึงทั้งหมด)</p>
                      </div>
                    </>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      คำอธิบาย
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="ระบุรายละเอียดเพิ่มเติม..."
                    />
                  </div>

                  {/* Auth Type - Only for REST API */}
                  {formData.dataSource !== 'MONGODB' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Authentication Type
                        </label>
                        <select
                          value={formData.authType || 'none'}
                          onChange={(e) => setFormData({ ...formData, authType: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {AUTH_TYPES.map(auth => (
                            <option key={auth.value} value={auth.value}>{auth.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Auth Fields */}
                      {formData.authType === 'bearer' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bearer Token
                      </label>
                      <input
                        type="password"
                        value={formData.authToken || ''}
                        onChange={(e) => setFormData({ ...formData, authToken: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter bearer token"
                      />
                    </div>
                  )}

                  {formData.authType === 'api-key' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={formData.authToken || ''}
                        onChange={(e) => setFormData({ ...formData, authToken: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter API key"
                      />
                    </div>
                  )}

                  {formData.authType === 'basic' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username
                        </label>
                        <input
                          type="text"
                          value={formData.authUsername || ''}
                          onChange={(e) => setFormData({ ...formData, authUsername: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          value={formData.authPassword || ''}
                          onChange={(e) => setFormData({ ...formData, authPassword: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                    </>
                  )}

                  {/* Active Status */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive || false}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Enable this API
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saveLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {saveLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={type.value} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{type.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{type.label}</h4>
                    <p className="text-xs text-gray-500">{type.value}</p>
                  </div>
                </div>
                {setting?.isActive && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Active
                  </span>
                )}
              </div>

              {setting ? (
                <>
                  <div className="space-y-2 mb-4">
                    <div className="text-sm">
                      <span className="text-gray-600">URL:</span>
                      <p className="text-gray-900 truncate" title={setting.url}>{setting.url}</p>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Auth:</span>
                      <span className="ml-2 text-gray-900">{setting.authType}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Last Sync:</span>
                      <span className="ml-2 text-gray-900">{formatDate(setting.lastSyncedAt)}</span>
                    </div>
                    {setting.lastSyncStatus && (
                      <div className="text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full border ${getStatusColor(setting.lastSyncStatus)}`}>
                          {setting.lastSyncStatus}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(setting)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(setting.apiType)}
                      className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100"
                    >
                      ลบ
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">ยังไม่ได้ตั้งค่า API</p>
                  <button
                    onClick={() => handleNew(type.value)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    ตั้งค่า API
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">วิธีใช้งาน:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>กำหนด API URL สำหรับแต่ละประเภทข้อมูล</li>
              <li>เลือกประเภท Authentication ที่เหมาะสม</li>
              <li>ระบบจะดึงข้อมูลจาก API เหล่านี้เมื่อทำ Import</li>
              <li>ตรวจสอบ Last Sync และ Status เพื่อดูผลการ sync ล่าสุด</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiSettings;
