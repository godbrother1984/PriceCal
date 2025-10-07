// path: client/src/components/ActivityLogs.tsx
// version: 1.0 (Activity Logs Component)
// last-modified: 29 กันยายน 2568 17:30

import React, { useState, useEffect } from 'react';

// --- Types ---
interface ActivityLog {
  id: number;
  requestId: string;
  userId?: string;
  userName: string;
  activityType: string;
  description: string;
  oldValue?: string;
  newValue?: string;
  notes?: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    name: string;
  };
  priceRequest?: {
    id: string;
    customerName: string;
    productName: string;
  };
}

interface ActivityLogsProps {
  requestId?: string; // ถ้ามี requestId จะแสดงเฉพาะ logs ของ request นั้น
  title?: string;
}

// --- Activity Type Labels ---
const activityTypeLabels: Record<string, string> = {
  'REQUEST_CREATED': 'สร้างคำขอ',
  'STATUS_CHANGED': 'เปลี่ยนสถานะ',
  'CALCULATION_COMPLETED': 'คำนวณราคาเสร็จสิ้น',
  'APPROVAL_REQUESTED': 'ส่งขออนุมัติ',
  'APPROVED': 'อนุมัติ',
  'REJECTED': 'ปฏิเสธ',
  'REVISION_REQUESTED': 'ขอแก้ไข',
  'BOQ_UPDATED': 'อัปเดต BOQ',
  'SPECIAL_REQUEST_ADDED': 'เพิ่ม Special Request',
  'SPECIAL_REQUEST_UPDATED': 'แก้ไข Special Request',
  'SPECIAL_REQUEST_REMOVED': 'ลบ Special Request',
};

// --- Activity Type Colors ---
const activityTypeColors: Record<string, string> = {
  'REQUEST_CREATED': 'bg-blue-100 text-blue-800',
  'STATUS_CHANGED': 'bg-yellow-100 text-yellow-800',
  'CALCULATION_COMPLETED': 'bg-green-100 text-green-800',
  'APPROVAL_REQUESTED': 'bg-orange-100 text-orange-800',
  'APPROVED': 'bg-green-100 text-green-800',
  'REJECTED': 'bg-red-100 text-red-800',
  'REVISION_REQUESTED': 'bg-purple-100 text-purple-800',
  'BOQ_UPDATED': 'bg-indigo-100 text-indigo-800',
  'SPECIAL_REQUEST_ADDED': 'bg-teal-100 text-teal-800',
  'SPECIAL_REQUEST_UPDATED': 'bg-teal-100 text-teal-800',
  'SPECIAL_REQUEST_REMOVED': 'bg-gray-100 text-gray-800',
};

const ActivityLogs: React.FC<ActivityLogsProps> = ({ requestId, title = 'Activity Logs' }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [requestId]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const url = requestId
        ? `http://localhost:3001/api/activity-logs/request/${requestId}`
        : 'http://localhost:3001/api/activity-logs';

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Activity logs response:', data);

      if (data.success && Array.isArray(data.data)) {
        setLogs(data.data);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      console.error('Error loading activity logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityTypeLabel = (type: string) => {
    return activityTypeLabels[type] || type;
  };

  const getActivityTypeColor = (type: string) => {
    return activityTypeColors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="text-red-600 text-center py-4">
          <p>เกิดข้อผิดพลาด: {error}</p>
          <button
            onClick={loadLogs}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{title}</h3>
          {!requestId && (
            <span className="text-sm text-gray-600">
              {logs.length} รายการ
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>ยังไม่มี Activity Logs</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityTypeColor(log.activityType)}`}>
                        {getActivityTypeLabel(log.activityType)}
                      </span>
                      <span className="text-sm text-gray-600">
                        โดย {log.userName}
                      </span>
                      {!requestId && log.priceRequest && (
                        <span className="text-sm text-gray-500">
                          • {log.priceRequest.customerName} - {log.priceRequest.productName}
                        </span>
                      )}
                    </div>

                    <p className="text-gray-800 mb-2">{log.description}</p>

                    {log.notes && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-2">
                        <p className="text-sm text-yellow-800">
                          <strong>หมายเหตุ:</strong> {log.notes}
                        </p>
                      </div>
                    )}

                    {(log.oldValue || log.newValue) && (
                      <details className="text-sm text-gray-600">
                        <summary className="cursor-pointer hover:text-gray-800">
                          ดูรายละเอียดการเปลี่ยนแปลง
                        </summary>
                        <div className="mt-2 p-2 bg-gray-50 rounded">
                          {log.oldValue && (
                            <div className="mb-2">
                              <strong>ค่าเก่า:</strong>
                              <pre className="text-xs mt-1 whitespace-pre-wrap">
                                {JSON.stringify(JSON.parse(log.oldValue), null, 2)}
                              </pre>
                            </div>
                          )}
                          {log.newValue && (
                            <div>
                              <strong>ค่าใหม่:</strong>
                              <pre className="text-xs mt-1 whitespace-pre-wrap">
                                {JSON.stringify(JSON.parse(log.newValue), null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>

                  <div className="text-sm text-gray-500 ml-4">
                    {formatDateTime(log.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;