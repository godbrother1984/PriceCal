// path: client/src/components/ApprovalWorkflow.tsx
// version: 2.0 (Horizontal Layout with Comment Modal)
// last-modified: 25 กันยายน 2568 10:00

import React, { useState, useEffect } from 'react';

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  order: number;
  comment?: string;
}

interface ApprovalWorkflowProps {
  defaultSteps?: WorkflowStep[];
  onWorkflowChange?: (steps: WorkflowStep[]) => void;
  readonly?: boolean;
  requestStatus?: 'Draft' | 'Pending' | 'Calculating' | 'Pending Approval' | 'Approved' | 'Rejected';
  onApproveStep?: (stepId: string, comment: string) => void;
}

const defaultWorkflowSteps: WorkflowStep[] = [
  {
    id: 'draft',
    title: 'สร้างร่างคำขอ',
    description: 'สร้างและแก้ไขคำขอราคาเบื้องต้น',
    assignee: 'Sales Team',
    status: 'pending',
    order: 1
  },
  {
    id: 'pending_review',
    title: 'รอการตรวจสอบ',
    description: 'คำขอราคาอยู่ระหว่างการรอตรวจสอบ',
    assignee: 'Review Team',
    status: 'pending',
    order: 2
  },
  {
    id: 'calculating',
    title: 'กำลังคำนวณราคา',
    description: 'ระบบกำลังคำนวณราคาและต้นทุน',
    assignee: 'System',
    status: 'pending',
    order: 3
  },
  {
    id: 'pending_approval',
    title: 'รออนุมัติราคา',
    description: 'รอการอนุมัติราคาจาก Manager',
    assignee: 'Sales Manager',
    status: 'pending',
    order: 4
  },
  {
    id: 'approved',
    title: 'อนุมัติแล้ว',
    description: 'ราคาได้รับการอนุมัติเรียบร้อย',
    assignee: 'Sales Manager',
    status: 'pending',
    order: 5
  }
];

const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  defaultSteps = defaultWorkflowSteps,
  onWorkflowChange,
  readonly = false,
  requestStatus = 'Pending',
  onApproveStep
}) => {
  const [steps, setSteps] = useState<WorkflowStep[]>(defaultSteps);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStep, setSelectedStep] = useState<WorkflowStep | null>(null);
  const [comment, setComment] = useState('');

  // อัพเดท workflow steps ตาม request status จริง
  useEffect(() => {
    console.log('[ApprovalWorkflow] Request status changed:', requestStatus);

    const updatedSteps = steps.map((step, index) => {
      if (requestStatus === 'Draft') {
        // ถ้าเป็น draft ให้ทุก step เป็น pending
        return { ...step, status: 'pending' as const };
      } else if (requestStatus === 'Pending') {
        // ถ้าเป็น pending ให้ step ที่ 2 (pending_review) เป็น in_progress
        if (index === 0) {
          return { ...step, status: 'completed' as const }; // draft เสร็จแล้ว
        } else if (index === 1) {
          return { ...step, status: 'in_progress' as const }; // รอการตรวจสอบ
        } else {
          return { ...step, status: 'pending' as const };
        }
      } else if (requestStatus === 'Calculating') {
        // ถ้าเป็น calculating ให้ step แรก 2 step เป็น completed, step ที่ 3 เป็น in_progress
        if (index <= 1) {
          return { ...step, status: 'completed' as const };
        } else if (index === 2) {
          return { ...step, status: 'in_progress' as const }; // กำลังคำนวณ
        } else {
          return { ...step, status: 'pending' as const };
        }
      } else if (requestStatus === 'Pending Approval') {
        // ถ้าเป็น pending approval ให้ step แรก 3 step เป็น completed, step ที่ 4 เป็น in_progress
        if (index <= 2) {
          return { ...step, status: 'completed' as const };
        } else if (index === 3) {
          return { ...step, status: 'in_progress' as const }; // รออนุมัติ
        } else {
          return { ...step, status: 'pending' as const };
        }
      } else if (requestStatus === 'Approved') {
        // ถ้า approved แล้ว ให้ทุก step เป็น completed
        return { ...step, status: 'completed' as const };
      } else if (requestStatus === 'Rejected') {
        // ถ้า rejected แล้ว ให้ step ที่ 3 เป็น rejected (default reject at pending approval)
        if (index <= 2) {
          return { ...step, status: 'completed' as const };
        } else if (index === 3) {
          return { ...step, status: 'rejected' as const };
        } else {
          return { ...step, status: 'pending' as const };
        }
      }

      return step;
    });

    setSteps(updatedSteps);
    onWorkflowChange?.(updatedSteps);
  }, [requestStatus]);

  const getStatusColor = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusIcon = (status: WorkflowStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const handleApproveClick = (step: WorkflowStep) => {
    setSelectedStep(step);
    setComment('');
    setModalOpen(true);
  };

  const handleSubmitApproval = () => {
    if (selectedStep && onApproveStep) {
      onApproveStep(selectedStep.id, comment);
      setModalOpen(false);
      setSelectedStep(null);
      setComment('');
    }
  };

  const handleCancelApproval = () => {
    setModalOpen(false);
    setSelectedStep(null);
    setComment('');
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Approval Workflow</h3>
          <p className="text-sm text-slate-600 mt-1">กำหนดขั้นตอนการอนุมัติคำขอราคา</p>
        </div>
      </div>

      {/* Horizontal Workflow */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              {/* Step */}
              <div className="flex flex-col items-center relative">
                {/* Step Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getStatusColor(step.status)} mb-2`}>
                  {getStatusIcon(step.status)}
                </div>

                {/* Step Content */}
                <div className="text-center max-w-32">
                  <h4 className="text-sm font-semibold text-slate-800 mb-1">{step.title}</h4>
                  <p className="text-xs text-slate-600 mb-1">{step.assignee}</p>

                  {/* Status Badge */}
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(step.status)}`}>
                    {step.status === 'pending' && 'รอดำเนินการ'}
                    {step.status === 'in_progress' && 'กำลังดำเนินการ'}
                    {step.status === 'completed' && 'เสร็จสิ้น'}
                    {step.status === 'rejected' && 'ปฏิเสธ'}
                  </span>

                  {/* Approve Button for in_progress steps */}
                  {!readonly && step.status === 'in_progress' && (
                    <button
                      onClick={() => handleApproveClick(step)}
                      className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                    >
                      อนุมัติ
                    </button>
                  )}

                  {/* Show comment if exists */}
                  {step.comment && (
                    <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-left">
                      <div className="font-medium text-slate-700">Comment:</div>
                      <div className="text-slate-600">{step.comment}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 bg-slate-200 mx-4 mt-[-24px]"></div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">ความคืบหน้าโดยรวม:</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${(steps.filter(s => s.status === 'completed').length / steps.length) * 100}%`
                }}
              ></div>
            </div>
            <span className="text-slate-700 font-medium">
              {steps.filter(s => s.status === 'completed').length}/{steps.length}
            </span>
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {modalOpen && selectedStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">อนุมัติขั้นตอน: {selectedStep.title}</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ความคิดเห็น (Comment)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="กรอกความคิดเห็นเกี่ยวกับการอนุมัติ (ไม่บังคับ)"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelApproval}
                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-md hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmitApproval}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                ยืนยันการอนุมัติ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalWorkflow;