// path: client/src/components/ImportManager.tsx
// version: 1.0 (Master Data Import Manager UI)
// last-modified: 1 ตุลาคม 2568 10:30

import React, { useState, useEffect } from 'react';

interface ImportStats {
  rawMaterials?: { inserted: number; updated: number; errors: number };
  finishedGoods?: { inserted: number; updated: number; errors: number };
  bomItems?: { inserted: number; updated: number; errors: number };
}

interface ImportResult {
  success: boolean;
  message: string;
  data?: ImportStats;
  errors?: string[];
}

interface ImportStatus {
  lastSyncedAt: string | null;
  autoUpdateEnabled: boolean;
}

const ImportManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ImportStatus>({
    lastSyncedAt: null,
    autoUpdateEnabled: true,
  });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // Load import status on mount
  useEffect(() => {
    loadImportStatus();
  }, []);

  const loadImportStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/import/status');
      const data = await response.json();

      if (data.success && data.data) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Error loading import status:', error);
    }
  };

  const handleImportAll = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/import/all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        await loadImportStatus();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({
        success: false,
        message: `Failed to import: ${errorMessage}`,
        errors: [errorMessage],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportRawMaterials = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/import/raw-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        await loadImportStatus();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({
        success: false,
        message: `Failed to import: ${errorMessage}`,
        errors: [errorMessage],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportFinishedGoods = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3001/api/import/finished-goods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        await loadImportStatus();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResult({
        success: false,
        message: `Failed to import: ${errorMessage}`,
        errors: [errorMessage],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Import Status</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-600 mb-1">Last Sync</div>
            <div className="text-lg font-semibold text-slate-900">
              {formatDate(status.lastSyncedAt)}
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-600 mb-1">Auto-Update</div>
            <div className="flex items-center gap-2">
              <div className={`text-lg font-semibold ${status.autoUpdateEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {status.autoUpdateEnabled ? 'Enabled' : 'Disabled'}
              </div>
              {status.autoUpdateEnabled && (
                <span className="text-xs text-slate-500">(Daily on first login)</span>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">การนำเข้าข้อมูล:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>ระบบจะดึงข้อมูลจาก <strong>External API</strong> ที่ตั้งค่าไว้</li>
                <li>กรุณาตั้งค่า API ใน <strong>🔌 API Settings</strong> ก่อนทำ Import</li>
                <li>Raw Materials: ดึงจาก Raw Materials API</li>
                <li>Finished Goods + BOQ: ดึงจาก Finished Goods API</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Import Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Manual Import</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleImportAll}
            disabled={loading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Importing...
              </span>
            ) : (
              '📦 Import All Data'
            )}
          </button>

          <button
            onClick={handleImportRawMaterials}
            disabled={loading}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            🔧 Import Raw Materials
          </button>

          <button
            onClick={handleImportFinishedGoods}
            disabled={loading}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            📋 Import Finished Goods
          </button>
        </div>
      </div>

      {/* Import Result */}
      {result && (
        <div className={`rounded-lg shadow p-6 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              {result.success ? (
                <svg className="w-6 h-6 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div>
                <h4 className={`font-semibold mb-1 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                  {result.success ? 'Import Successful' : 'Import Failed'}
                </h4>
                <p className={`text-sm ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => setResult(null)}
              className={`${result.success ? 'text-green-600 hover:text-green-800' : 'text-red-600 hover:text-red-800'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          {result.data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {result.data.rawMaterials && (
                <div className="p-3 bg-white rounded border border-slate-200">
                  <div className="text-xs font-medium text-slate-600 mb-2">Raw Materials</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Inserted:</span>
                      <span className="font-semibold text-green-600">{result.data.rawMaterials.inserted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Updated:</span>
                      <span className="font-semibold text-blue-600">{result.data.rawMaterials.updated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Errors:</span>
                      <span className="font-semibold text-red-600">{result.data.rawMaterials.errors}</span>
                    </div>
                  </div>
                </div>
              )}

              {result.data.finishedGoods && (
                <div className="p-3 bg-white rounded border border-slate-200">
                  <div className="text-xs font-medium text-slate-600 mb-2">Finished Goods</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Inserted:</span>
                      <span className="font-semibold text-green-600">{result.data.finishedGoods.inserted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Updated:</span>
                      <span className="font-semibold text-blue-600">{result.data.finishedGoods.updated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Errors:</span>
                      <span className="font-semibold text-red-600">{result.data.finishedGoods.errors}</span>
                    </div>
                  </div>
                </div>
              )}

              {result.data.bomItems && (
                <div className="p-3 bg-white rounded border border-slate-200">
                  <div className="text-xs font-medium text-slate-600 mb-2">BOQ Items</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Inserted:</span>
                      <span className="font-semibold text-green-600">{result.data.bomItems.inserted}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Updated:</span>
                      <span className="font-semibold text-blue-600">{result.data.bomItems.updated}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Errors:</span>
                      <span className="font-semibold text-red-600">{result.data.bomItems.errors}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Errors */}
          {result.errors && result.errors.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setShowErrors(!showErrors)}
                className="text-sm font-medium text-red-700 hover:text-red-900 flex items-center gap-2"
              >
                {showErrors ? '▼' : '▶'} Show Errors ({result.errors.length})
              </button>

              {showErrors && (
                <div className="mt-2 p-3 bg-white rounded border border-red-300 max-h-60 overflow-y-auto">
                  <ul className="space-y-1 text-xs text-red-800">
                    {result.errors.map((error, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-600">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportManager;
