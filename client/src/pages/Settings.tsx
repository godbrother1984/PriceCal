// path: client/src/pages/Settings.tsx
// version: 1.3 (Add MongoDB Connection Settings)
// last-modified: 1 ตุลาคม 2568 15:35

import React, { useState, useEffect } from 'react';
import ApiSettings from '../components/ApiSettings';

type SettingsTab = 'api' | 'system' | 'import' | 'mongodb';

const SystemConfig: React.FC = () => {
    const [config, setConfig] = useState({
      companyName: '',
      currency: '',
      taxRate: 0,
      timezone: '',
      autoApprove: false,
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      loadConfig();
    }, []);

    const loadConfig = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/data/system-config/systemSettings');
        if (response.ok) {
          const data = await response.json();
          if (data && data.value) {
            const savedConfig = JSON.parse(data.value);
            setConfig(savedConfig);
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleSave = async () => {
      setSaving(true);
      try {
        // TODO: Call API to save system config
        await fetch('http://localhost:3001/api/data/system-config/systemSettings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            value: JSON.stringify(config),
            description: 'System configuration settings',
          }),
        });

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (error) {
        console.error('Failed to save settings:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">⚙️ System Configuration</h3>

          {loading && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              กำลังโหลดการตั้งค่า...
            </div>
          )}

          {saved && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              ✅ บันทึกการตั้งค่าเรียบร้อยแล้ว
            </div>
          )}

          <div className="space-y-4">
            {/* Company Info */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company Name
              </label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default Currency
                </label>
                <select
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="THB">THB - Thai Baht</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={config.taxRate}
                  onChange={(e) => setConfig({ ...config, taxRate: parseFloat(e.target.value) })}
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Timezone
              </label>
              <select
                value={config.timezone}
                onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
              <input
                type="checkbox"
                id="autoApprove"
                checked={config.autoApprove}
                onChange={(e) => setConfig({ ...config, autoApprove: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoApprove" className="text-sm text-slate-700">
                Enable auto-approval for prices below threshold
              </label>
            </div>

            <div className="pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {saving ? 'กำลังบันทึก...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>

    </div>
  );
};

const ImportConfig: React.FC = () => {
    const [importConfig, setImportConfig] = useState({
      autoUpdateEnabled: false,
      autoUpdateTime: '',
      maxRecords: 0,
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      loadConfig();
    }, []);

    const loadConfig = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/data/system-config/importSettings');
        if (response.ok) {
          const data = await response.json();
          if (data && data.value) {
            const savedConfig = JSON.parse(data.value);
            setImportConfig(savedConfig);
          }
        }
      } catch (error) {
        console.error('Failed to load import settings:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleSave = async () => {
      setSaving(true);
      try {
        await fetch('http://localhost:3001/api/data/system-config/importSettings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            value: JSON.stringify(importConfig),
            description: 'Import configuration settings',
          }),
        });

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (error) {
        console.error('Failed to save import settings:', error);
        alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">📊 Import Configuration</h3>

          {loading && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
              กำลังโหลดการตั้งค่า...
            </div>
          )}

          {saved && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
              ✅ บันทึกการตั้งค่าเรียบร้อยแล้ว
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <div className="font-medium">Auto-Update Enabled</div>
                <div className="text-sm text-slate-600">Automatically import data once daily</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={importConfig.autoUpdateEnabled}
                  onChange={(e) => setImportConfig({ ...importConfig, autoUpdateEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Auto-Update Time
              </label>
              <input
                type="time"
                value={importConfig.autoUpdateTime}
                onChange={(e) => setImportConfig({ ...importConfig, autoUpdateTime: e.target.value })}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">ระบบจะทำ import อัตโนมัติในเวลานี้ทุกวัน</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Maximum Records per Import
              </label>
              <input
                type="number"
                value={importConfig.maxRecords}
                onChange={(e) => setImportConfig({ ...importConfig, maxRecords: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">จำกัดจำนวน records สูงสุดที่จะ import ในแต่ละครั้ง</p>
            </div>

            <div className="pt-4 border-t">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {saving ? 'กำลังบันทึก...' : 'Save Import Settings'}
              </button>
            </div>
          </div>
        </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">💡 Tips:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>ตั้งค่า API Settings ก่อนเปิด Auto-Update</li>
              <li>Auto-Update จะทำงานเมื่อมี user login คนแรกหลังเวลาที่กำหนด</li>
              <li>สามารถ Import manually ได้ตลอดเวลาที่ Master Data → Import Data</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const MongoDBConfig: React.FC = () => {
  const [mongoConfig, setMongoConfig] = useState({
    host: 'localhost',
    port: '27017',
    database: 'pricecal',
    username: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/data/system-config/mongodbSettings');
      if (response.ok) {
        const data = await response.json();
        if (data && data.value) {
          const savedConfig = JSON.parse(data.value);
          setMongoConfig(savedConfig);
        }
      }
    } catch (error) {
      console.error('Failed to load MongoDB settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('http://localhost:3001/api/data/system-config/mongodbSettings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: JSON.stringify(mongoConfig),
          description: 'MongoDB connection settings',
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        alert('บันทึกการตั้งค่า MongoDB เรียบร้อย\nกรุณา restart server เพื่อให้การตั้งค่ามีผล');
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
      }
    } catch (error) {
      console.error('Failed to save MongoDB settings:', error);
      alert('เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🍃 MongoDB Connection Settings</h3>

        {loading && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
            กำลังโหลดการตั้งค่า...
          </div>
        )}

        {saved && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            ✅ บันทึกการตั้งค่าเรียบร้อยแล้ว
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Host
              </label>
              <input
                type="text"
                value={mongoConfig.host}
                onChange={(e) => setMongoConfig({ ...mongoConfig, host: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="localhost"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Port
              </label>
              <input
                type="text"
                value={mongoConfig.port}
                onChange={(e) => setMongoConfig({ ...mongoConfig, port: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="27017"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Database Name
            </label>
            <input
              type="text"
              value={mongoConfig.database}
              onChange={(e) => setMongoConfig({ ...mongoConfig, database: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="pricecal"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Username (optional)
              </label>
              <input
                type="text"
                value={mongoConfig.username}
                onChange={(e) => setMongoConfig({ ...mongoConfig, username: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ไม่ระบุถ้าไม่มี authentication"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password (optional)
              </label>
              <input
                type="password"
                value={mongoConfig.password}
                onChange={(e) => setMongoConfig({ ...mongoConfig, password: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ไม่ระบุถ้าไม่มี authentication"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {saving ? 'กำลังบันทึก...' : 'Save MongoDB Settings'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">⚠️ สำคัญ:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>หลังจากบันทึกการตั้งค่า ต้อง restart server เพื่อให้การเชื่อมต่อ MongoDB มีผล</li>
              <li>ถ้าไม่มี authentication ให้เว้นว่าง Username และ Password</li>
              <li>สามารถใช้ environment variables แทนได้: MONGODB_HOST, MONGODB_PORT, MONGODB_DATABASE, MONGODB_USERNAME, MONGODB_PASSWORD</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api');

  const tabs = [
    { id: 'api' as SettingsTab, label: '🔌 API Settings', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    { id: 'system' as SettingsTab, label: '⚙️ System Config', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { id: 'import' as SettingsTab, label: '📊 Import Config', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' },
    { id: 'mongodb' as SettingsTab, label: '🍃 MongoDB', icon: 'M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">⚙️ Settings</h1>
        <p className="text-slate-600 mt-1">จัดการการตั้งค่าระบบและการเชื่อมต่อ API</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 border-b-2 font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'api' && <ApiSettings />}
        {activeTab === 'system' && <SystemConfig />}
        {activeTab === 'import' && <ImportConfig />}
        {activeTab === 'mongodb' && <MongoDBConfig />}
      </div>
    </div>
  );
};

export default Settings;
