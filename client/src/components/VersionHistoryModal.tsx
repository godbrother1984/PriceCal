// path: client/src/components/VersionHistoryModal.tsx
// version: 1.5 (Add LME and Exchange Rate support - Phase 2.3)
// last-modified: 29 ตุลาคม 2568 05:10

import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, Archive, RotateCcw, AlertCircle, Trash2 } from 'lucide-react';
import { getVersionHistory, rollbackVersion, approveVersion } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import api from '../services/api';

// Master Data Type Union
export type MasterDataType = 'standardPrice' | 'fabCost' | 'sellingFactor' | 'scrapAllowance' | 'lme' | 'exchangeRate';

// Common Version Interface (all master data share these fields via VersionedEntity)
export interface VersionRecord {
  id: string;
  version: number;
  status: 'Draft' | 'Active' | 'Archived';
  approvedBy: string | null;
  approvedAt: Date | null;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  changeReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  // Type-specific data (will be displayed in details)
  [key: string]: any;
}

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataType: MasterDataType;
  recordId: string;
  recordName: string; // Display name (e.g., "Copper (CU)", "PRM Pattern", "USD → THB")
  onRollbackSuccess?: () => void;
}

// API endpoints for each data type
const API_ENDPOINTS = {
  standardPrice: '/api/data/standard-prices',
  fabCost: '/api/data/fab-costs',
  sellingFactor: '/api/data/selling-factors',
  scrapAllowance: '/api/data/scrap-allowances',
  lme: '/api/data/lme-master-data',
  exchangeRate: '/api/data/exchange-rate-master-data',
};

// Thai labels for data types
const DATA_TYPE_LABELS: Record<MasterDataType, string> = {
  standardPrice: 'ราคามาตรฐานวัตถุดิบ',
  fabCost: 'FAB Cost',
  sellingFactor: 'Selling Factor',
  scrapAllowance: 'Scrap Allowance',
  lme: 'ราคา LME',
  exchangeRate: 'อัตราแลกเปลี่ยน',
};

// Status badge components
const StatusBadge: React.FC<{ status: 'Draft' | 'Active' | 'Archived' }> = ({ status }) => {
  const styles = {
    Draft: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Active: 'bg-green-100 text-green-800 border-green-300',
    Archived: 'bg-gray-100 text-gray-600 border-gray-300',
  };

  const icons = {
    Draft: <Clock className="w-3 h-3" />,
    Active: <CheckCircle className="w-3 h-3" />,
    Archived: <Archive className="w-3 h-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {icons[status]}
      {status}
    </span>
  );
};

// Format date to Thai Buddhist calendar
const formatThaiDate = (date: Date | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get display fields for each data type
const getDisplayFields = (dataType: MasterDataType, record: VersionRecord): { label: string; value: any }[] => {
  switch (dataType) {
    case 'standardPrice':
      return [
        { label: 'วัตถุดิบ', value: record.rawMaterialId },
        { label: 'ราคา', value: `${record.price?.toLocaleString() || 0} ${record.currency || 'THB'}` },
      ];
    case 'fabCost':
      return [
        { label: 'วัตถุดิบ', value: record.rawMaterialId },
        { label: 'FAB Cost', value: `${record.fabCost?.toLocaleString() || 0} THB` },
      ];
    case 'sellingFactor':
      return [
        { label: 'Pattern', value: `${record.patternName} (${record.patternCode})` },
        { label: 'Factor', value: record.factor || 0 },
      ];
    case 'scrapAllowance':
      return [
        { label: 'Item Group', value: `${record.itemGroupCode} - ${record.itemGroupName || 'N/A'}` },
        { label: 'Scrap %', value: `${((record.scrapPercentage || 0) * 100).toFixed(2)}%` },
      ];
    case 'lme':
      return [
        { label: 'Item Group', value: `${record.itemGroupName} (${record.itemGroupCode})` },
        { label: 'ราคา', value: `${record.price?.toLocaleString() || 0} ${record.currency || 'THB'}` },
      ];
    case 'exchangeRate':
      return [
        { label: 'สกุลเงิน', value: `${record.sourceCurrencyCode} → ${record.destinationCurrencyCode}` },
        { label: 'อัตรา', value: record.rate || 0 },
      ];
    default:
      return [];
  }
};

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  dataType,
  recordId,
  recordName,
  onRollbackSuccess,
}) => {
  const [versions, setVersions] = useState<VersionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState<string | null>(null); // ID of version being rolled back
  const [deleting, setDeleting] = useState<string | null>(null); // ID of version being deleted
  const [approving, setApproving] = useState<string | null>(null); // ID of version being approved
  const toast = useToast(); // ✅ Use Toast context

  // Fetch version history
  useEffect(() => {
    if (isOpen) {
      fetchVersionHistory();
    }
  }, [isOpen, dataType, recordId]);

  const fetchVersionHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      // ✅ Use centralized API method
      const data = await getVersionHistory(dataType, recordId);
      setVersions(data);
    } catch (err: any) {
      console.error('Error fetching version history:', err);
      setError(err.response?.data?.message || err.message || 'ไม่สามารถโหลดประวัติเวอร์ชันได้');
    } finally {
      setLoading(false);
    }
  };

  // Rollback to archived version
  const handleRollback = async (versionId: string) => {
    if (!confirm('คุณต้องการ Rollback กลับไปยังเวอร์ชันนี้หรือไม่?')) {
      return;
    }

    setRollingBack(versionId);
    setError(null);

    try {
      // ✅ Use centralized API method
      await rollbackVersion(dataType, versionId);

      // Success - refresh history and notify parent
      await fetchVersionHistory();
      if (onRollbackSuccess) {
        onRollbackSuccess();
      }

      // ✅ Show success toast
      toast.success('Rollback สำเร็จ!', 'สร้าง Draft version ใหม่แล้ว');
    } catch (err: any) {
      console.error('Error during rollback:', err);
      const errorMessage = err.response?.data?.message || err.message || 'ไม่สามารถ Rollback ได้';
      setError(errorMessage);

      // ✅ Show error toast
      toast.error('Rollback ล้มเหลว', errorMessage);
    } finally {
      setRollingBack(null);
    }
  };

  // Delete Draft version
  const handleDelete = async (versionId: string) => {
    if (!confirm('คุณต้องการลบ Draft version นี้หรือไม่?')) {
      return;
    }

    setDeleting(versionId);
    setError(null);

    try {
      // Map dataType to endpoint
      const endpoints: Record<string, string> = {
        fabCost: '/api/data/fab-costs',
        standardPrice: '/api/data/standard-prices',
        sellingFactor: '/api/data/selling-factors',
        lme: '/api/data/lme-master-data',
        exchangeRate: '/api/data/exchange-rate-master-data',
      };

      const endpoint = endpoints[dataType];
      await api.delete(`${endpoint}/${versionId}`);

      // Success - refresh history and notify parent
      await fetchVersionHistory();
      if (onRollbackSuccess) {
        onRollbackSuccess();
      }

      // ✅ Show success toast
      toast.success('ลบสำเร็จ!', 'Draft version ถูกลบแล้ว');
    } catch (err: any) {
      console.error('Error during delete:', err);
      const errorMessage = err.response?.data?.message || err.message || 'ไม่สามารถลบได้';
      setError(errorMessage);

      // ✅ Show error toast
      toast.error('ลบล้มเหลว', errorMessage);
    } finally {
      setDeleting(null);
    }
  };

  // Approve Draft version
  const handleApprove = async (versionId: string) => {
    if (!confirm('คุณต้องการ Approve Draft version นี้หรือไม่?\n(Active version เก่าจะกลายเป็น Archived)')) {
      return;
    }

    setApproving(versionId);
    setError(null);

    try {
      // ✅ Use centralized API method
      await approveVersion(dataType, versionId);

      // Success - refresh history and notify parent
      await fetchVersionHistory();
      if (onRollbackSuccess) {
        onRollbackSuccess();
      }

      // ✅ Show success toast
      toast.success('Approve สำเร็จ!', 'Draft version เป็น Active แล้ว');
    } catch (err: any) {
      console.error('Error during approve:', err);
      const errorMessage = err.response?.data?.message || err.message || 'ไม่สามารถ Approve ได้';
      setError(errorMessage);

      // ✅ Show error toast
      toast.error('Approve ล้มเหลว', errorMessage);
    } finally {
      setApproving(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">ประวัติเวอร์ชัน</h2>
            <p className="text-sm text-gray-600 mt-1">
              {DATA_TYPE_LABELS[dataType]}: <span className="font-medium">{recordName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">กำลังโหลดประวัติ...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">เกิดข้อผิดพลาด</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && versions.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Archive className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>ไม่พบประวัติเวอร์ชัน</p>
            </div>
          )}

          {!loading && !error && versions.length > 0 && (
            <div className="space-y-4">
              {/* Version Timeline */}
              <div className="relative">
                {versions.map((version, index) => (
                  <div key={version.id} className="relative pb-8 last:pb-0">
                    {/* Timeline line */}
                    {index < versions.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
                    )}

                    {/* Version card */}
                    <div className="relative flex gap-4">
                      {/* Timeline dot */}
                      <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-4 border-white ${
                        version.status === 'Active' ? 'bg-green-500' :
                        version.status === 'Draft' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`}>
                        <span className="text-white text-xs font-bold">v{version.version}</span>
                      </div>

                      {/* Card content */}
                      <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-semibold text-gray-900">
                                Version {version.version}
                              </span>
                              <StatusBadge status={version.status} />
                            </div>
                            <p className="text-sm text-gray-600">
                              สร้างโดย: <span className="font-medium">{version.createdBy}</span>
                              {' • '}
                              {formatThaiDate(version.createdAt)}
                            </p>
                          </div>

                          {/* Action buttons based on status */}
                          <div className="flex items-center gap-2">
                            {/* Approve button for Draft versions */}
                            {version.status === 'Draft' && (
                              <button
                                onClick={() => handleApprove(version.id)}
                                disabled={approving === version.id}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <CheckCircle className={`w-4 h-4 ${approving === version.id ? 'animate-spin' : ''}`} />
                                {approving === version.id ? 'กำลัง Approve...' : 'Approve'}
                              </button>
                            )}

                            {/* Delete button for Draft versions */}
                            {version.status === 'Draft' && (
                              <button
                                onClick={() => handleDelete(version.id)}
                                disabled={deleting === version.id}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className={`w-4 h-4 ${deleting === version.id ? 'animate-spin' : ''}`} />
                                {deleting === version.id ? 'กำลังลบ...' : 'Delete'}
                              </button>
                            )}

                            {/* Rollback button for Archived versions */}
                            {version.status === 'Archived' && (
                              <button
                                onClick={() => handleRollback(version.id)}
                                disabled={rollingBack === version.id}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <RotateCcw className={`w-4 h-4 ${rollingBack === version.id ? 'animate-spin' : ''}`} />
                                {rollingBack === version.id ? 'กำลัง Rollback...' : 'Rollback'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Data fields */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          {getDisplayFields(dataType, version).map((field, i) => (
                            <div key={i}>
                              <span className="text-xs text-gray-500">{field.label}:</span>
                              <span className="ml-2 text-sm font-medium text-gray-900">{field.value}</span>
                            </div>
                          ))}
                        </div>

                        {/* Approval info */}
                        {version.status === 'Active' || version.status === 'Archived' ? (
                          <div className="text-xs text-gray-600 border-t border-gray-200 pt-3">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-gray-500">อนุมัติโดย:</span>
                                <span className="ml-2 font-medium">{version.approvedBy || '-'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">วันที่อนุมัติ:</span>
                                <span className="ml-2">{formatThaiDate(version.approvedAt)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">มีผลตั้งแต่:</span>
                                <span className="ml-2">{formatThaiDate(version.effectiveFrom)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">มีผลถึง:</span>
                                <span className="ml-2">{formatThaiDate(version.effectiveTo)}</span>
                              </div>
                            </div>
                            {version.changeReason && (
                              <div className="mt-2">
                                <span className="text-gray-500">เหตุผลการเปลี่ยนแปลง:</span>
                                <p className="text-gray-700 mt-1 text-sm">{version.changeReason}</p>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;
