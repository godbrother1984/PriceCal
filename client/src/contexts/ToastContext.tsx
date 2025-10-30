// path: client/src/contexts/ToastContext.tsx
// version: 1.0 (Toast Context Provider)
// last-modified: 28 ตุลาคม 2568 17:00

import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast, { ToastType } from '../components/Toast';

interface ToastOptions {
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastItem extends ToastOptions {
  id: string;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: ToastItem = { ...options, id };
    setToasts((prev) => [...prev, toast]);
  }, []);

  const success = useCallback((message: string, description?: string) => {
    showToast({ type: 'success', message, description });
  }, [showToast]);

  const error = useCallback((message: string, description?: string) => {
    showToast({ type: 'error', message, description });
  }, [showToast]);

  const warning = useCallback((message: string, description?: string) => {
    showToast({ type: 'warning', message, description });
  }, [showToast]);

  const info = useCallback((message: string, description?: string) => {
    showToast({ type: 'info', message, description });
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}

      {/* Toast Container - Fixed at top-right */}
      <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
        <div className="flex flex-col items-end pointer-events-auto">
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              type={toast.type}
              message={toast.message}
              description={toast.description}
              duration={toast.duration}
              onClose={removeToast}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export default ToastContext;
