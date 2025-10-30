// path: client/src/components/Toast.tsx
// version: 1.0 (Toast Notification System)
// last-modified: 28 ตุลาคม 2568 17:00

import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  description,
  duration = 5000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  const styles = {
    success: {
      container: 'bg-green-50 border-green-200',
      icon: 'text-green-600',
      title: 'text-green-800',
      description: 'text-green-700',
      iconComponent: CheckCircle,
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      description: 'text-red-700',
      iconComponent: XCircle,
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      description: 'text-yellow-700',
      iconComponent: AlertCircle,
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      description: 'text-blue-700',
      iconComponent: Info,
    },
  };

  const style = styles[type];
  const IconComponent = style.iconComponent;

  return (
    <div
      className={`${style.container} border rounded-lg shadow-lg p-4 mb-3 flex items-start gap-3 animate-slide-in-right max-w-md`}
    >
      <IconComponent className={`${style.icon} w-5 h-5 flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className={`${style.title} text-sm font-medium mb-1`}>{message}</p>
        {description && (
          <p className={`${style.description} text-sm`}>{description}</p>
        )}
      </div>
      <button
        onClick={() => onClose(id)}
        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
