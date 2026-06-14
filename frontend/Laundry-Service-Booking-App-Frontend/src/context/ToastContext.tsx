'use client';

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { FiCheck, FiAlertCircle, FiInfo, FiX, FiAlertTriangle } from 'react-icons/fi';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <FiCheck className="w-4 h-4" />,
  error: <FiAlertCircle className="w-4 h-4" />,
  info: <FiInfo className="w-4 h-4" />,
  warning: <FiAlertTriangle className="w-4 h-4" />,
};

const toastColors: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  // Confirm modal state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    options: ConfirmOptions;
    resolve: ((value: boolean) => void) | null;
  }>({ open: false, options: { message: '' }, resolve: null });

  const showToast = useCallback((message: string, type: ToastType = 'error') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ open: true, options, resolve });
    });
  }, []);

  const confirmStateRef = useRef(confirmState);
  confirmStateRef.current = confirmState;

  const handleConfirmResult = useCallback((result: boolean) => {
    confirmStateRef.current.resolve?.(result);
    setConfirmState({ open: false, options: { message: '' }, resolve: null });
  }, []);

  const confirmTypeColors = {
    danger: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-amber-500 hover:bg-amber-600',
    info: 'bg-[#0F2744] dark:bg-[#00BFA6] hover:bg-[#1a3a5c] dark:hover:bg-[#00A892]',
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toastColors[toast.type]} animate-slide-in-right`}
          >
            {toastIcons[toast.type]}
            <span className="flex-1">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)} className="ml-2 opacity-70 hover:opacity-100">
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Confirm modal */}
      {confirmState.open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={() => handleConfirmResult(false)} />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
              {confirmState.options.title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {confirmState.options.title}
                </h3>
              )}
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {confirmState.options.message}
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => handleConfirmResult(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {confirmState.options.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={() => handleConfirmResult(true)}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${confirmTypeColors[confirmState.options.type || 'info']}`}
                >
                  {confirmState.options.confirmText || 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </ToastContext.Provider>
  );
};
