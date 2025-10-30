// path: client/src/components/QuickApprovalTaskList.tsx
// version: 1.11 (Update navigation to settings instead of master-data)
// last-modified: 30 ตุลาคม 2568 17:55

import React, { useState, useEffect, useMemo } from 'react';
import { API_CONFIG, APP_CONFIG } from '../config/env';

interface TaskItem {
  id: string;
  type: string;
  requestNumber?: string;
  title: string;
  customerName?: string;
  productName?: string;
  status?: string;
  entityType?: string;
  version?: string;
  description?: string;
  changeReason?: string;
  createdBy?: string;
  createdAt: string;
  newValue?: string;
  itemGroup?: string;
  tubeSize?: string;
  currencyPair?: string;
}

interface QuickApprovalTaskListProps {
  tasks: TaskItem[];
  onRefresh: () => void;
  onTaskClick: (task: TaskItem) => void;
  onApprove?: (taskIds: string[]) => Promise<void>;
  onReject?: (taskIds: string[]) => Promise<void>;
  onNavigate?: (page: string, options?: { requestId?: string; openModal?: boolean; entityId?: string; entityType?: string }) => void;
}

export const QuickApprovalTaskList: React.FC<QuickApprovalTaskListProps> = ({
  tasks,
  onRefresh,
  onTaskClick,
  onApprove,
  onReject,
  onNavigate,
}) => {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [showQuickView, setShowQuickView] = useState<TaskItem | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search, Filter, Sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'title'>('date-desc');

  // Pagination states - Show 5 items per page (compact view)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleSelectAll = () => {
    const approvableTasks = tasks.filter(canApprove);
    if (selectedTasks.size === approvableTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(approvableTasks.map((t) => t.id)));
    }
  };

  const handleToggleSelect = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedTasks.size === 0) return;

    const count = selectedTasks.size;
    const actionText = action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ';

    if (!confirm(`ยืนยันการ${actionText} ${count} รายการ?`)) {
      return;
    }

    setProcessingAction(true);
    try {
      const taskIds = Array.from(selectedTasks);
      if (action === 'approve' && onApprove) {
        await onApprove(taskIds);
        setToastMessage({ type: 'success', message: `${actionText}สำเร็จ ${count} รายการ` });
      } else if (action === 'reject' && onReject) {
        await onReject(taskIds);
        setToastMessage({ type: 'success', message: `${actionText}สำเร็จ ${count} รายการ` });
      }
      setSelectedTasks(new Set());
      onRefresh();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error('Bulk action error:', error);
      setToastMessage({ type: 'error', message: 'เกิดข้อผิดพลาด: ' + (error as Error).message });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleQuickAction = async (
    task: TaskItem,
    action: 'approve' | 'reject',
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    const actionText = action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ';
    if (!confirm(`ยืนยัน${actionText}: ${task.title}?`)) {
      return;
    }

    setProcessingAction(true);
    try {
      if (action === 'approve' && onApprove) {
        await onApprove([task.id]);
        setToastMessage({ type: 'success', message: `${actionText}สำเร็จ: ${task.title}` });
      } else if (action === 'reject' && onReject) {
        await onReject([task.id]);
        setToastMessage({ type: 'success', message: `${actionText}สำเร็จ: ${task.title}` });
      }
      onRefresh();
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error('Quick action error:', error);
      setToastMessage({ type: 'error', message: 'เกิดข้อผิดพลาด: ' + (error as Error).message });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setProcessingAction(false);
    }
  };

  const canApprove = (task: TaskItem): boolean => {
    return task.type === 'master-data-approval' || task.type === 'price-request-approval';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-200 text-gray-700';
      case 'Pending':
        return 'bg-yellow-200 text-yellow-800';
      case 'Calculating':
        return 'bg-blue-200 text-blue-800';
      case 'Pending Approval':
        return 'bg-orange-200 text-orange-800';
      case 'Approved':
        return 'bg-green-200 text-green-800';
      case 'Rejected':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'เมื่อสักครู่';
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
    if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get unique task types for filter
  const taskTypes = useMemo(() => {
    const types = new Set(tasks.map(t => t.type));
    return Array.from(types);
  }, [tasks]);

  // Filtered and sorted tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.customerName?.toLowerCase().includes(query) ||
        task.productName?.toLowerCase().includes(query) ||
        task.requestNumber?.toLowerCase().includes(query)
      );
    }

    // Apply filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(task => task.type === filterType);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title, 'th');
      }
      return 0;
    });

    return filtered;
  }, [tasks, searchQuery, filterType, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTasks.length / itemsPerPage);
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedTasks, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, sortBy]);

  const approvableTasks = paginatedTasks.filter(canApprove);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center">
          <span className="mr-2">📋</span>
          งานของฉัน
          <span className="ml-3 px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-700 rounded-full">
            {filteredAndSortedTasks.length}
          </span>
        </h2>
        <button
          onClick={onRefresh}
          className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          🔄 รีเฟรช
        </button>
      </div>

      {/* Search, Filter, Sort Controls */}
      <div className="mb-4 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="ค้นหา... (ชื่อ, ลูกค้า, สินค้า, เลขที่)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Filter by Type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">ทุกประเภท</option>
            {taskTypes.map(type => (
              <option key={type} value={type}>
                {type === 'master-data-approval' ? 'อนุมัติ Master Data' :
                 type === 'price-request-approval' ? 'อนุมัติคำขอราคา' :
                 type === 'price-calculation' ? 'คำนวณราคา' :
                 type === 'my-request' ? 'คำขอของฉัน' : type}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date-desc">วันที่ใหม่สุด</option>
            <option value="date-asc">วันที่เก่าสุด</option>
            <option value="title">ชื่อ (ก-ฮ)</option>
          </select>

          {/* Select All */}
          {approvableTasks.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800 ml-auto">
              <input
                type="checkbox"
                checked={selectedTasks.size === approvableTasks.length && approvableTasks.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
              />
              <span>เลือกทั้งหมด</span>
            </label>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedTasks.size > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm text-gray-700 mr-2">เลือก {selectedTasks.size} รายการ:</span>
            <button
              onClick={() => handleBulkAction('approve')}
              disabled={processingAction}
              className="px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              ✅ อนุมัติทั้งหมด
            </button>
            <button
              onClick={() => handleBulkAction('reject')}
              disabled={processingAction}
              className="px-3 py-1.5 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              ❌ ปฏิเสธทั้งหมด
            </button>
            <button
              onClick={() => setSelectedTasks(new Set())}
              className="ml-auto px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm"
            >
              ยกเลิก
            </button>
          </div>
        )}
      </div>

      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <div className="text-5xl mb-3">{searchQuery || filterType !== 'all' ? '🔍' : '✅'}</div>
          <p className="text-lg font-medium">
            {searchQuery || filterType !== 'all' ? 'ไม่พบรายการที่ค้นหา' : 'ไม่มีงานที่ต้องทำในขณะนี้'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery || filterType !== 'all' ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'ยอดเยี่ยม! คุณทำงานเสร็จหมดแล้ว'}
          </p>
        </div>
      ) : (
        <>
          {/* Task List - No scrollbar, fixed height for 5 items */}
          <div className="space-y-3 min-h-[480px]">
            {paginatedTasks.map((task) => {
            const isApprovable = canApprove(task);
            return (
              <div
                key={task.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  {isApprovable && (
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={() => handleToggleSelect(task.id)}
                      className="w-5 h-5 mt-1 rounded border-gray-300 cursor-pointer text-blue-600 focus:ring-2 focus:ring-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  {/* Task Content */}
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => onTaskClick(task)}
                  >
                    <h3 className="font-semibold text-gray-900 mb-1.5 hover:text-blue-600 transition-colors">
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600 mb-2">
                      {task.customerName && (
                        <span className="flex items-center">
                          <span className="text-gray-400 mr-1">👤</span>
                          {task.customerName}
                        </span>
                      )}
                      {task.productName && (
                        <span className="flex items-center">
                          <span className="text-gray-400 mr-1">📦</span>
                          {task.productName}
                        </span>
                      )}
                      {task.version && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          v{task.version}
                        </span>
                      )}
                      {task.changeReason && (
                        <span className="text-gray-500 italic">• {task.changeReason}</span>
                      )}
                      {task.createdBy && (
                        <span className="flex items-center text-gray-500">
                          <span className="text-gray-400 mr-1">✏️</span>
                          {task.createdBy}
                        </span>
                      )}
                    </div>
                    {task.status && (
                      <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap" title={new Date(task.createdAt).toLocaleString('th-TH')}>
                      🕒 {formatDate(task.createdAt)}
                    </span>
                    {isApprovable && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowQuickView(task);
                          }}
                          className="px-2.5 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                          title="ดูรายละเอียด"
                        >
                          👁️ ดู
                        </button>
                        <button
                          onClick={(e) => handleQuickAction(task, 'approve', e)}
                          disabled={processingAction}
                          className="px-2.5 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                          title="อนุมัติด่วน"
                        >
                          ✅
                        </button>
                        <button
                          onClick={(e) => handleQuickAction(task, 'reject', e)}
                          disabled={processingAction}
                          className="px-2.5 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                          title="ปฏิเสธ"
                        >
                          ❌
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination - Always show when there are tasks */}
        {filteredAndSortedTasks.length > 0 && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <div className="text-sm text-slate-600">
              แสดง <span className="font-semibold text-slate-900">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-semibold text-slate-900">{Math.min(currentPage * itemsPerPage, filteredAndSortedTasks.length)}</span> จาก <span className="font-semibold text-slate-900">{filteredAndSortedTasks.length}</span> รายการ
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center gap-1"
              >
                <span>←</span>
                <span className="hidden sm:inline">ก่อนหน้า</span>
              </button>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                    // Show first, last, current, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            page === currentPage
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'border border-slate-300 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 text-slate-400">...</span>;
                    }
                    return null;
                  })}
                </div>
              )}

              {totalPages === 1 && (
                <div className="px-3 py-2 text-sm text-slate-500">
                  หน้า 1 / 1
                </div>
              )}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors flex items-center gap-1"
              >
                <span className="hidden sm:inline">ถัดไป</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}
      </>
      )}

      {/* Quick View Modal */}
      {showQuickView && (
        <QuickViewModal
          task={showQuickView}
          onClose={() => setShowQuickView(null)}
          onApprove={async () => {
            if (onApprove) {
              try {
                await onApprove([showQuickView.id]);
                setToastMessage({ type: 'success', message: `อนุมัติสำเร็จ: ${showQuickView.title}` });
                setShowQuickView(null);
                onRefresh();
                setTimeout(() => setToastMessage(null), 3000);
              } catch (error) {
                setToastMessage({ type: 'error', message: 'เกิดข้อผิดพลาด: ' + (error as Error).message });
                setTimeout(() => setToastMessage(null), 5000);
                throw error;
              }
            }
          }}
          onReject={async () => {
            if (onReject) {
              try {
                await onReject([showQuickView.id]);
                setToastMessage({ type: 'success', message: `ปฏิเสธสำเร็จ: ${showQuickView.title}` });
                setShowQuickView(null);
                onRefresh();
                setTimeout(() => setToastMessage(null), 3000);
              } catch (error) {
                setToastMessage({ type: 'error', message: 'เกิดข้อผิดพลาด: ' + (error as Error).message });
                setTimeout(() => setToastMessage(null), 5000);
                throw error;
              }
            }
          }}
          onNavigate={onNavigate}
          processingAction={processingAction}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-[60]">
          <div className={`rounded-lg shadow-lg p-4 min-w-[300px] ${
            toastMessage.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`text-2xl ${toastMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {toastMessage.type === 'success' ? '✅' : '❌'}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${toastMessage.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {toastMessage.message}
                </p>
              </div>
              <button
                onClick={() => setToastMessage(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Quick View Modal Component
const QuickViewModal: React.FC<{
  task: TaskItem;
  onClose: () => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onNavigate?: (page: string, options?: { requestId?: string; openModal?: boolean; entityId?: string; entityType?: string }) => void;
  processingAction: boolean;
}> = ({ task, onClose, onApprove, onReject, onNavigate, processingAction }) => {
  const [taskDetail, setTaskDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function fetchTaskDetail() {
      setLoadingDetail(true);
      setError(null);
      try {
        const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (!token) {
          throw new Error('ไม่พบ token การเข้าสู่ระบบ');
        }

        const url = `${API_CONFIG.BASE_URL}/dashboard/task-detail/${task.id}?type=${task.type}${task.entityType ? `&entityType=${task.entityType}` : ''}`;
        console.log('Fetching task detail:', url);

        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('ไม่สามารถโหลดข้อมูลได้');
        }

        const data = await response.json();
        console.log('Task detail:', data);
        setTaskDetail(data);
      } catch (error) {
        console.error('Failed to fetch task detail:', error);
        setError((error as Error).message || 'เกิดข้อผิดพลาด');
      } finally {
        setLoadingDetail(false);
      }
    }
    fetchTaskDetail();
  }, [task.id, task.type, task.entityType]);

  const handleOpenMainPage = () => {
    if (!onNavigate) return;

    console.log('handleOpenMainPage called with:', { task, taskDetail });

    if (task.type === 'price-request-approval' || task.type === 'price-calculation' || task.type === 'my-request') {
      console.log('Navigating to price-requests');
      onNavigate('price-requests', {
        requestId: task.id,
        openModal: true
      });
    } else if (task.type === 'master-data-approval') {
      const navigationOptions = {
        openModal: true,
        entityId: taskDetail?.entityId || task.id,
        entityType: task.entityType
      };
      console.log('Navigating to settings (master-data) with options:', navigationOptions);
      onNavigate('settings', navigationOptions);
    } else if (task.type === 'dummy-mapping') {
      console.log('Navigating to settings (master-data) (no options)');
      onNavigate('settings');
    }
    onClose();
  };

  const formatEntityType = (entityType: string): string => {
    const typeMap: Record<string, string> = {
      'fab-cost': 'FAB Cost',
      'selling-factor': 'Selling Factor',
      'lme-price': 'LME Price',
      'exchange-rate': 'อัตราแลกเปลี่ยน',
      'standard-price': 'Standard Price',
      'scrap-allowance': 'Scrap Allowance',
    };
    return typeMap[entityType] || entityType;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{task.title}</h2>
              <div className="flex gap-2 flex-wrap">
                {task.version && (
                  <span className="inline-block px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                    เวอร์ชัน {task.version}
                  </span>
                )}
                {task.entityType && (
                  <span className="inline-block px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                    {formatEntityType(task.entityType)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 240px)' }}>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
                <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-4xl mb-3">⚠️</div>
              <p className="text-red-600">{error}</p>
            </div>
          ) : taskDetail ? (
            <div className="space-y-4">
              {/* Price Request Details */}
              {taskDetail.type === 'price-request' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">เลขที่คำขอ</label>
                      <p className="text-lg text-gray-900">{taskDetail.requestNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">สถานะ</label>
                      <span className={`inline-block px-3 py-1 text-sm rounded ${getStatusColorClass(taskDetail.status)}`}>
                        {taskDetail.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">ลูกค้า</label>
                      <p className="text-lg text-gray-900">{taskDetail.customerName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">สินค้า</label>
                      <p className="text-lg text-gray-900">{taskDetail.productName}</p>
                    </div>
                  </div>

                  {taskDetail.quantity && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">จำนวน</label>
                      <p className="text-gray-900">{taskDetail.quantity.toLocaleString()}</p>
                    </div>
                  )}

                  {taskDetail.requestedPrice && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">ราคาที่ขอ</label>
                      <p className="text-gray-900">{taskDetail.requestedPrice.toLocaleString()} บาท</p>
                    </div>
                  )}

                  {taskDetail.calculationResult && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">ผลการคำนวณ</label>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-xl font-bold text-blue-700">
                          {taskDetail.calculationResult.totalPrice?.toLocaleString() || 'N/A'} บาท
                        </p>
                      </div>
                    </div>
                  )}

                  {taskDetail.remarks && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">หมายเหตุ</label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{taskDetail.remarks}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">สร้างโดย</label>
                      <p className="text-gray-900">{taskDetail.createdBy}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">วันที่สร้าง</label>
                      <p className="text-gray-900">
                        {new Date(taskDetail.createdAt).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Master Data Details - FAB Cost */}
              {taskDetail.entityType === 'fab-cost' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">ประเภทข้อมูล</label>
                      <p className="text-lg text-gray-900">FAB Cost</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">สถานะ</label>
                      <span className={`inline-block px-3 py-1 text-sm rounded ${taskDetail.status === 'Draft' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                        {taskDetail.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">ชื่อ</label>
                      <p className="text-lg text-gray-900 font-semibold">{taskDetail.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">เวอร์ชัน</label>
                      <p className="text-gray-900 font-semibold text-lg">v{taskDetail.version}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">ค่า FAB Cost</label>
                    <p className="text-3xl font-bold text-blue-600">{taskDetail.cost?.toLocaleString() || 'N/A'} บาท</p>
                  </div>

                  {taskDetail.description && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">รายละเอียด</label>
                      <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">{taskDetail.description}</p>
                    </div>
                  )}

                  {taskDetail.changeReason && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">เหตุผลการเปลี่ยนแปลง</label>
                      <p className="text-gray-900 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">{taskDetail.changeReason}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {taskDetail.effectiveDate && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600 mb-1 block">วันที่มีผล</label>
                        <p className="text-gray-900">
                          {new Date(taskDetail.effectiveDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {taskDetail.expiryDate && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600 mb-1 block">วันหมดอายุ</label>
                        <p className="text-gray-900">
                          {new Date(taskDetail.expiryDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t">
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">วันที่สร้าง</label>
                    <p className="text-gray-900">
                      {new Date(taskDetail.createdAt).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </>
              )}

              {/* Master Data Details - Selling Factor */}
              {taskDetail.entityType === 'selling-factor' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">ประเภทข้อมูล</label>
                      <p className="text-lg text-gray-900">Selling Factor</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">สถานะ</label>
                      <span className={`inline-block px-3 py-1 text-sm rounded ${taskDetail.status === 'Draft' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                        {taskDetail.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">รหัส Pattern</label>
                      <p className="text-lg text-gray-900 font-semibold">{taskDetail.patternCode}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">เวอร์ชัน</label>
                      <p className="text-gray-900 font-semibold text-lg">v{taskDetail.version}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">ชื่อ Pattern</label>
                    <p className="text-lg text-gray-900">{taskDetail.patternName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">Selling Factor</label>
                    <p className="text-3xl font-bold text-blue-600">{taskDetail.factor}</p>
                  </div>

                  {taskDetail.description && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">รายละเอียด</label>
                      <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">{taskDetail.description}</p>
                    </div>
                  )}

                  {taskDetail.changeReason && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">เหตุผลการเปลี่ยนแปลง</label>
                      <p className="text-gray-900 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">{taskDetail.changeReason}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {taskDetail.effectiveDate && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600 mb-1 block">วันที่มีผล</label>
                        <p className="text-gray-900">
                          {new Date(taskDetail.effectiveDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {taskDetail.expiryDate && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600 mb-1 block">วันหมดอายุ</label>
                        <p className="text-gray-900">
                          {new Date(taskDetail.expiryDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t">
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">วันที่สร้าง</label>
                    <p className="text-gray-900">
                      {new Date(taskDetail.createdAt).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </>
              )}

              {/* Master Data Details - LME Price */}
              {taskDetail.entityType === 'lme-price' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">ประเภทข้อมูล</label>
                      <p className="text-lg text-gray-900">LME Price</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">สถานะ</label>
                      <span className={`inline-block px-3 py-1 text-sm rounded ${taskDetail.status === 'Draft' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                        {taskDetail.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">รหัสกลุ่มสินค้า</label>
                      <p className="text-lg text-gray-900 font-semibold">{taskDetail.itemGroupCode}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">เวอร์ชัน</label>
                      <p className="text-gray-900 font-semibold text-lg">v{taskDetail.version}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">ชื่อกลุ่มสินค้า</label>
                    <p className="text-lg text-gray-900">{taskDetail.itemGroupName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">ราคา LME (THB/{taskDetail.priceUnit || 'หน่วย'})</label>
                    <p className="text-3xl font-bold text-blue-600">{taskDetail.price?.toLocaleString() || 'N/A'} บาท</p>
                  </div>

                  {taskDetail.description && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">รายละเอียด</label>
                      <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">{taskDetail.description}</p>
                    </div>
                  )}

                  {taskDetail.changeReason && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">เหตุผลการเปลี่ยนแปลง</label>
                      <p className="text-gray-900 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">{taskDetail.changeReason}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {taskDetail.effectiveDate && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600 mb-1 block">วันที่มีผล</label>
                        <p className="text-gray-900">
                          {new Date(taskDetail.effectiveDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {taskDetail.expiryDate && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600 mb-1 block">วันหมดอายุ</label>
                        <p className="text-gray-900">
                          {new Date(taskDetail.expiryDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t">
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">วันที่สร้าง</label>
                    <p className="text-gray-900">
                      {new Date(taskDetail.createdAt).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </>
              )}

              {/* Master Data Details - Exchange Rate */}
              {taskDetail.entityType === 'exchange-rate' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">ประเภทข้อมูล</label>
                      <p className="text-lg text-gray-900">อัตราแลกเปลี่ยน</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">สถานะ</label>
                      <span className={`inline-block px-3 py-1 text-sm rounded ${taskDetail.status === 'Draft' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                        {taskDetail.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">คู่สกุลเงิน</label>
                      <p className="text-xl text-gray-900 font-semibold">{taskDetail.sourceCurrencyCode} → {taskDetail.destinationCurrencyCode}</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">เวอร์ชัน</label>
                      <p className="text-gray-900 font-semibold text-lg">v{taskDetail.version}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">อัตราแลกเปลี่ยน</label>
                    <p className="text-3xl font-bold text-blue-600">{taskDetail.rate?.toFixed(6) || 'N/A'}</p>
                  </div>

                  {taskDetail.description && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">รายละเอียด</label>
                      <p className="text-gray-900 bg-blue-50 p-3 rounded-lg">{taskDetail.description}</p>
                    </div>
                  )}

                  {taskDetail.changeReason && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">เหตุผลการเปลี่ยนแปลง</label>
                      <p className="text-gray-900 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">{taskDetail.changeReason}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {taskDetail.effectiveDate && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600 mb-1 block">วันที่มีผล</label>
                        <p className="text-gray-900">
                          {new Date(taskDetail.effectiveDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    {taskDetail.expiryDate && (
                      <div>
                        <label className="text-sm font-semibold text-gray-600 mb-1 block">วันหมดอายุ</label>
                        <p className="text-gray-900">
                          {new Date(taskDetail.expiryDate).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t">
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">วันที่สร้าง</label>
                    <p className="text-gray-900">
                      {new Date(taskDetail.createdAt).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </>
              )}

              {/* Master Data Details - Standard Price */}
              {taskDetail.entityType === 'standard-price' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">ประเภทข้อมูล</label>
                      <p className="text-lg text-gray-900">Standard Price</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">สถานะ</label>
                      <span className={`inline-block px-3 py-1 text-sm rounded ${taskDetail.isActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                        {taskDetail.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">วัตถุดิบ</label>
                    <p className="text-lg text-gray-900 font-semibold">{taskDetail.rawMaterialName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">ราคามาตรฐาน ({taskDetail.priceUnit || 'หน่วย'})</label>
                    <p className="text-3xl font-bold text-blue-600">{taskDetail.price?.toLocaleString() || 'N/A'} บาท</p>
                  </div>

                  {taskDetail.effectiveDate && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-1 block">วันที่มีผล</label>
                      <p className="text-gray-900">
                        {new Date(taskDetail.effectiveDate).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">วันที่สร้าง</label>
                    <p className="text-gray-900">
                      {new Date(taskDetail.createdAt).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </>
              )}

              {/* Product Mapping */}
              {taskDetail.type === 'product-mapping' && (
                <>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">สินค้า</label>
                    <p className="text-lg text-gray-900">{taskDetail.productName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">สถานะ</label>
                    <p className="text-gray-900">{taskDetail.hasDummyMapping ? '✅ Mapped แล้ว' : '⚠️ ยังไม่ได้ Map'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">วันที่สร้าง</label>
                    <p className="text-gray-900">
                      {new Date(taskDetail.createdAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between gap-3 border-t">
          <button
            onClick={handleOpenMainPage}
            disabled={!onNavigate}
            className="px-5 py-2.5 text-blue-600 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📋 เปิดหน้าหลัก
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
            >
              ปิด
            </button>
            <button
              onClick={async () => {
                if (confirm('ยืนยันการปฏิเสธ?')) {
                  setIsProcessing(true);
                  try {
                    await onReject();
                  } catch (error) {
                    console.error('Error rejecting:', error);
                    alert('เกิดข้อผิดพลาด: ' + (error as Error).message);
                  } finally {
                    setIsProcessing(false);
                  }
                }
              }}
              disabled={isProcessing || loadingDetail}
              className="px-6 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  กำลังปฏิเสธ...
                </>
              ) : (
                <>❌ ปฏิเสธ</>
              )}
            </button>
            <button
              onClick={async () => {
                if (confirm('ยืนยันการอนุมัติ?')) {
                  setIsProcessing(true);
                  try {
                    await onApprove();
                  } catch (error) {
                    console.error('Error approving:', error);
                    alert('เกิดข้อผิดพลาด: ' + (error as Error).message);
                  } finally {
                    setIsProcessing(false);
                  }
                }
              }}
              disabled={isProcessing || loadingDetail}
              className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  กำลังอนุมัติ...
                </>
              ) : (
                <>✅ อนุมัติ</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function for status colors
const getStatusColorClass = (status: string): string => {
  switch (status) {
    case 'Draft':
      return 'bg-gray-200 text-gray-700';
    case 'Pending':
      return 'bg-yellow-200 text-yellow-800';
    case 'Calculating':
      return 'bg-blue-200 text-blue-800';
    case 'Pending Approval':
      return 'bg-orange-200 text-orange-800';
    case 'Approved':
      return 'bg-green-200 text-green-800';
    case 'Rejected':
      return 'bg-red-200 text-red-800';
    default:
      return 'bg-gray-200 text-gray-700';
  }
};

export default QuickApprovalTaskList;
