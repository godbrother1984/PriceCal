// path: client/src/pages/Dashboard.tsx
// version: 2.6 (Fix Stats Cards - Show Priority Stats Including Master Data)
// last-modified: 29 ตุลาคม 2568 12:00

import React, { useState, useEffect } from 'react';
import { API_CONFIG, APP_CONFIG } from '../config/env';
import { QuickApprovalTaskList } from '../components/QuickApprovalTaskList';

interface StatCardData {
  count: number;
  label: string;
  icon: string;
  breakdown?: Record<string, number>;
}

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
  changeReason?: string;
  createdAt: string;
}

interface ActivityItem {
  id: number;
  entityId: string;
  username: string;
  action: string;
  entityType: string;
  description: string;
  createdAt: string;
}

interface DashboardStats {
  [key: string]: StatCardData;
}

interface DashboardProps {
  userRole?: string;
  onNavigate?: (page: string, options?: {
    requestId?: string;
    openModal?: boolean;
    entityId?: string;
    entityType?: string
  }) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole = 'Admin', onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats>({});
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      // ✅ ใช้ API_CONFIG.getUrl() สำหรับทุก endpoint (แก้ที่ไฟล์ config ที่เดียวแล้วจบ)
      const [statsRes, tasksRes, activitiesRes] = await Promise.all([
        fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.DASHBOARD_STATS), { headers }),
        fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.DASHBOARD_TASKS) + '?limit=5', { headers }),
        fetch(API_CONFIG.getUrl(API_CONFIG.ENDPOINTS.DASHBOARD_ACTIVITY) + '?limit=10', { headers }),
      ]);

      if (!statsRes.ok || !tasksRes.ok || !activitiesRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const statsData = await statsRes.json();
      const tasksData = await tasksRes.json();
      const activitiesData = await activitiesRes.json();

      console.log('📊 Dashboard Stats:', statsData);
      console.log('📋 Dashboard Tasks:', tasksData);
      console.log('📈 Dashboard Activities:', activitiesData);

      setStats(statsData);
      setTasks(tasksData);
      setActivities(activitiesData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('ไม่สามารถโหลดข้อมูล Dashboard ได้');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // Select 4 most important stats for display
  const priorityKeys = [
    'pendingApprovalRequests',  // รออนุมัติ (สำคัญที่สุด)
    'masterDataPending',         // Master Data รออนุมัติ
    'approvedThisMonth',         // อนุมัติแล้วเดือนนี้
    'draftRequests',             // Draft
  ];

  const topStats = priorityKeys
    .map(key => [key, stats[key]])
    .filter(([_, stat]) => stat !== undefined) as [string, StatCardData][];

  // If less than 4, fill with other stats
  if (topStats.length < 4) {
    const remainingStats = Object.entries(stats)
      .filter(([key]) => !priorityKeys.includes(key))
      .slice(0, 4 - topStats.length);
    topStats.push(...remainingStats);
  }

  console.log('🎴 Total stats entries:', Object.entries(stats).length);
  console.log('🎴 Selected stats for display:', topStats);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">ภาพรวมและงานที่ต้องทำ</p>
      </div>

      {/* Mini Stats Cards - Only 4 cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {topStats.map(([key, stat]) => (
          <MiniStatCard key={key} stat={stat} />
        ))}
      </div>

      {/* Main Content - Task List as Primary Focus */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Task List - Takes 3/4 of space */}
        <div className="lg:col-span-3">
          <QuickApprovalTaskList
            tasks={tasks}
            onRefresh={fetchDashboardData}
            onTaskClick={handleTaskClick}
            onApprove={handleApprove}
            onReject={handleReject}
            onNavigate={onNavigate}
          />
        </div>

        {/* Recent Activity - Compact, takes 1/4 */}
        <div className="lg:col-span-1">
          <RecentActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );

  function handleTaskClick(task: TaskItem) {
    console.log('Task clicked:', task);
    // Quick View Modal will be opened by QuickApprovalTaskList component
  }

  async function handleApprove(taskIds: string[]) {
    console.log('Approving tasks:', taskIds);

    const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN) || sessionStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('ไม่พบ token การเข้าสู่ระบบ');
    }

    // Group tasks by type
    const tasksByType = new Map<string, TaskItem[]>();
    taskIds.forEach(taskId => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const typeKey = task.type;
        if (!tasksByType.has(typeKey)) {
          tasksByType.set(typeKey, []);
        }
        tasksByType.get(typeKey)!.push(task);
      }
    });

    // Approve each type separately
    for (const [type, typeTasks] of tasksByType.entries()) {
      if (type === 'price-request-approval') {
        // TODO: Implement price request approval API
        console.log('Approving price requests:', typeTasks.map(t => t.id));
      } else if (type === 'master-data-approval') {
        // Approve master data by entityType
        for (const task of typeTasks) {
          await approveMasterData(task, token);
        }
      }
    }
  }

  async function handleReject(taskIds: string[]) {
    console.log('Rejecting tasks:', taskIds);

    const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN) || sessionStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
    if (!token) {
      throw new Error('ไม่พบ token การเข้าสู่ระบบ');
    }

    // Group tasks by type
    const tasksByType = new Map<string, TaskItem[]>();
    taskIds.forEach(taskId => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        const typeKey = task.type;
        if (!tasksByType.has(typeKey)) {
          tasksByType.set(typeKey, []);
        }
        tasksByType.get(typeKey)!.push(task);
      }
    });

    // Reject each type separately
    for (const [type, typeTasks] of tasksByType.entries()) {
      if (type === 'price-request-approval') {
        // TODO: Implement price request rejection API
        console.log('Rejecting price requests:', typeTasks.map(t => t.id));
      } else if (type === 'master-data-approval') {
        // Reject master data by entityType
        for (const task of typeTasks) {
          await rejectMasterData(task, token);
        }
      }
    }
  }

  async function approveMasterData(task: TaskItem, token: string) {
    const entityTypeMap: Record<string, string> = {
      'fab-cost': 'fab-costs',
      'selling-factor': 'selling-factors',
      'lme-price': 'lme-master-data',
      'exchange-rate': 'exchange-rate-master-data',
      'standard-price': 'standard-prices',
      'scrap-allowance': 'scrap-allowances',
    };

    const endpoint = entityTypeMap[task.entityType || ''];
    if (!endpoint) {
      throw new Error(`Unknown entity type: ${task.entityType}`);
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/api/data/${endpoint}/${task.id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to approve');
    }
  }

  async function rejectMasterData(task: TaskItem, token: string) {
    const entityTypeMap: Record<string, string> = {
      'fab-cost': 'fab-costs',
      'selling-factor': 'selling-factors',
      'lme-price': 'lme-master-data',
      'exchange-rate': 'exchange-rate-master-data',
      'standard-price': 'standard-prices',
      'scrap-allowance': 'scrap-allowances',
    };

    const endpoint = entityTypeMap[task.entityType || ''];
    if (!endpoint) {
      throw new Error(`Unknown entity type: ${task.entityType}`);
    }

    // Delete the draft record (rejection)
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/data/${endpoint}/${task.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reject');
    }
  }
};

// Mini StatCard Component - Compact Design
const MiniStatCard: React.FC<{ stat: StatCardData }> = ({ stat }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine status dot color based on count
  const getStatusDotColor = () => {
    if (stat.count === 0) return 'bg-green-500';
    if (stat.count > 20) return 'bg-red-500';
    if (stat.count > 10) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <div
      className="relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4 cursor-pointer group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Header: Icon + Status Dot */}
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl">{stat.icon}</div>
        <div className={`w-2.5 h-2.5 rounded-full ${getStatusDotColor()} group-hover:scale-125 transition-transform`}></div>
      </div>

      {/* Main Count */}
      <div className="text-4xl font-bold text-slate-900 mb-1">
        {stat.count}
      </div>

      {/* Label */}
      <div className="text-sm font-medium text-slate-600 truncate">
        {stat.label.split(' - ')[0]}
      </div>

      {/* Trend Indicator (if available) */}
      {stat.breakdown && (
        <div className="mt-2 text-xs text-slate-500">
          {Object.keys(stat.breakdown).length} items
        </div>
      )}

      {/* Tooltip with Breakdown - Shows on Hover */}
      {showTooltip && stat.breakdown && (
        <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-slate-900 text-white rounded-lg shadow-xl p-3 text-sm">
          <div className="font-semibold mb-2 text-slate-200">{stat.label}</div>
          <div className="space-y-1">
            {Object.entries(stat.breakdown).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-slate-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                <span className="font-medium text-white ml-2">{value}</span>
              </div>
            ))}
          </div>
          {/* Arrow pointer */}
          <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

// Old StatCard Component (kept for backwards compatibility if needed)
const StatCard: React.FC<{ stat: StatCardData }> = ({ stat }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl">{stat.icon}</div>
        <div className="text-3xl font-bold text-blue-600">{stat.count}</div>
      </div>
      <h3 className="text-gray-700 font-medium mb-2">{stat.label}</h3>
      {stat.breakdown && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          {Object.entries(stat.breakdown).map(([key, value]) => (
            <div key={key} className="flex justify-between text-sm text-gray-600 mb-1">
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// TaskList Component
const TaskList: React.FC<{
  tasks: TaskItem[];
  onRefresh: () => void;
  onTaskClick: (task: TaskItem) => void;
}> = ({ tasks, onRefresh, onTaskClick }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">งานของฉัน</h2>
        <button
          onClick={onRefresh}
          className="text-blue-500 hover:text-blue-600 text-sm font-medium"
        >
          🔄 รีเฟรช
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">✅</div>
          <p>ไม่มีงานที่ต้องทำในขณะนี้</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-96">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 mb-1">{task.title}</h3>
                  {task.customerName && (
                    <p className="text-sm text-gray-600 mb-1">ลูกค้า: {task.customerName}</p>
                  )}
                  {task.productName && (
                    <p className="text-sm text-gray-600 mb-1">สินค้า: {task.productName}</p>
                  )}
                  {task.status && (
                    <span className={`inline-block px-2 py-1 text-xs rounded ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  )}
                  {task.version && (
                    <span className="inline-block ml-2 px-2 py-1 text-xs rounded bg-purple-100 text-purple-700">
                      v{task.version}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 ml-4">
                  {new Date(task.createdAt).toLocaleDateString('th-TH')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// RecentActivityFeed Component - Compact Version
const RecentActivityFeed: React.FC<{ activities: ActivityItem[] }> = ({ activities }) => {
  const recentActivities = activities.slice(0, 6); // Show only 6 most recent

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col h-full">
      <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
        <span className="mr-2">📋</span>
        กิจกรรมล่าสุด
      </h2>

      {recentActivities.length === 0 ? (
        <div className="text-center py-6 text-slate-500">
          <div className="text-3xl mb-2">✨</div>
          <p className="text-sm">ยังไม่มีกิจกรรม</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="border-l-2 border-blue-400 pl-3 py-1">
              <p className="text-xs text-slate-700 line-clamp-2 mb-1">
                {activity.description}
              </p>
              <div className="flex items-center text-xs text-slate-500">
                <span className="font-medium">{activity.username}</span>
                <span className="mx-1">•</span>
                <span>{formatRelativeTime(activity.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activities.length > 6 && (
        <div className="mt-4 pt-3 border-t border-slate-200">
          <button className="text-xs text-blue-600 hover:text-blue-700 font-medium w-full text-center">
            ดูทั้งหมด ({activities.length})
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function to format relative time
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'เมื่อสักครู่';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} วันที่แล้ว`;
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
};

// Helper function for status colors
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

export default Dashboard;
