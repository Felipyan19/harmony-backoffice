'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastOptions {
  /** ms before auto-dismiss. Default 4000. */
  duration?: number;
}

interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
  duration: number;
}

interface ToastContextValue {
  success: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// success→primary, info→neutral, warning→warning, error→danger — the 4 app tokens, no 5th color.
const toneClass: Record<ToastVariant, string> = {
  success: 'bg-primary/10 text-primary ring-primary/25',
  info: 'bg-neutral/8 text-neutral/70 ring-neutral/15',
  warning: 'bg-warning/10 text-warning ring-warning/25',
  error: 'bg-danger/10 text-danger ring-danger/25',
};

const DEFAULT_DURATION = 4000;
let toastSeq = 0;

/** Mount once, near the root — it renders its own fixed viewport, nothing else to place. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((variant: ToastVariant, message: string, options?: ToastOptions) => {
    const id = `toast_${++toastSeq}`;
    setToasts((current) => [...current, { id, variant, message, duration: options?.duration ?? DEFAULT_DURATION }]);
  }, []);

  const value: ToastContextValue = {
    success: (message, options) => push('success', message, options),
    info: (message, options) => push('info', message, options),
    warning: (message, options) => push('warning', message, options),
    error: (message, options) => push('error', message, options),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((toast) => <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />)}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onDismiss]);

  return (
    <div className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm font-medium leading-4 shadow-lg ring-1 ring-inset ${toneClass[toast.variant]}`}>
      <span className="flex-1">{toast.message}</span>
      <button type="button" onClick={onDismiss} aria-label="Cerrar notificación" className="shrink-0 opacity-60 transition hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
