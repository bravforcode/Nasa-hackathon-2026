/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type FC,
  forwardRef,
} from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  X,
} from 'lucide-react';

export type ToastTone = 'accent' | 'success' | 'warning' | 'destructive';
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

export interface ToastAction {
  label: string;
  onClick: () => void;
  'aria-label'?: string;
}

export interface ToastData {
  id: string;
  tone?: ToastTone;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ToastAction;
  duration?: number; // ms, 0 or negative for sticky
}

export interface ToastProps {
  id?: string;
  tone?: ToastTone;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ToastAction;
  duration?: number;
  onDismiss?: () => void;
  className?: string;
}

const toneStyles: Record<
  ToastTone,
  {
    border: string;
    iconColor: string;
    glow: string;
    defaultIcon: ReactNode;
  }
> = {
  accent: {
    border: 'border-[var(--color-accent-subtle)]/40',
    iconColor: 'text-[var(--color-accent-subtle)]',
    glow: 'shadow-blue-500/10',
    defaultIcon: <Info className="w-5 h-5 text-[var(--color-accent-subtle)] shrink-0" aria-hidden="true" />,
  },
  success: {
    border: 'border-[var(--color-success-subtle)]/40',
    iconColor: 'text-[var(--color-success-subtle)]',
    glow: 'shadow-emerald-500/10',
    defaultIcon: <CheckCircle2 className="w-5 h-5 text-[var(--color-success-subtle)] shrink-0" aria-hidden="true" />,
  },
  warning: {
    border: 'border-[var(--color-warning-subtle)]/40',
    iconColor: 'text-[var(--color-warning-subtle)]',
    glow: 'shadow-amber-500/10',
    defaultIcon: <AlertTriangle className="w-5 h-5 text-[var(--color-warning-subtle)] shrink-0" aria-hidden="true" />,
  },
  destructive: {
    border: 'border-[var(--color-destructive-subtle)]/40',
    iconColor: 'text-[var(--color-destructive-subtle)]',
    glow: 'shadow-red-500/10',
    defaultIcon: <AlertOctagon className="w-5 h-5 text-[var(--color-destructive-subtle)] shrink-0" aria-hidden="true" />,
  },
};

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      tone = 'accent',
      title,
      description,
      icon,
      action,
      duration = 5000,
      onDismiss,
      className = '',
    },
    ref
  ) => {
    const isAlert = tone === 'destructive' || tone === 'warning';
    const role = isAlert ? 'alert' : 'status';
    const ariaLive = isAlert ? 'assertive' : 'polite';
    const toneConfig = toneStyles[tone];

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const remainingTimeRef = useRef<number>(duration);
    const startTimeRef = useRef<number>(Date.now());
    const isPausedRef = useRef<boolean>(false);

    const startTimer = () => {
      if (duration <= 0 || !onDismiss) return;
      startTimeRef.current = Date.now();
      timerRef.current = setTimeout(() => {
        onDismiss();
      }, remainingTimeRef.current);
    };

    const pauseTimer = () => {
      if (duration <= 0 || !onDismiss || isPausedRef.current) return;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
      isPausedRef.current = true;
    };

    const resumeTimer = () => {
      if (duration <= 0 || !onDismiss || !isPausedRef.current) return;
      isPausedRef.current = false;
      startTimer();
    };

    useEffect(() => {
      startTimer();
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }, [duration, onDismiss]);

    return (
      <div
        ref={ref}
        role={role}
        aria-live={ariaLive}
        onMouseEnter={pauseTimer}
        onMouseLeave={resumeTimer}
        onFocus={pauseTimer}
        onBlur={resumeTimer}
        className={`pointer-events-auto w-full max-w-sm rounded-xl p-4 glass-modal bg-[#0b0d14]/95 border shadow-2xl backdrop-blur-md font-mono text-xs text-slate-100 flex items-start gap-3 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${toneConfig.border} ${toneConfig.glow} ${className}`}
      >
        <div className="shrink-0 mt-0.5">
          {icon ?? toneConfig.defaultIcon}
        </div>

        <div className="flex-1 min-w-0 pr-1 space-y-1">
          {title && (
            <h3 className="font-headline font-bold text-sm text-white tracking-wide truncate">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-slate-300 text-xs leading-relaxed break-words font-mono">
              {description}
            </p>
          )}

          {action && (
            <div className="pt-2">
              <button
                type="button"
                onClick={action.onClick}
                aria-label={action['aria-label'] || action.label}
                className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/15 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] transition-colors min-h-8"
              >
                {action.label}
              </button>
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Close notification"
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';

/* =========================================================================
   Toast Context & Provider
   ========================================================================= */

interface ToastContextType {
  toasts: ToastData[];
  toast: {
    (data: Omit<ToastData, 'id'> & { id?: string }): string;
    accent: (title: ReactNode, description?: ReactNode, options?: Partial<Omit<ToastData, 'id' | 'title' | 'description' | 'tone'>>) => string;
    success: (title: ReactNode, description?: ReactNode, options?: Partial<Omit<ToastData, 'id' | 'title' | 'description' | 'tone'>>) => string;
    warning: (title: ReactNode, description?: ReactNode, options?: Partial<Omit<ToastData, 'id' | 'title' | 'description' | 'tone'>>) => string;
    destructive: (title: ReactNode, description?: ReactNode, options?: Partial<Omit<ToastData, 'id' | 'title' | 'description' | 'tone'>>) => string;
  };
  dismissToast: (id: string) => void;
  clearAll: () => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
}

const positionStyles: Record<ToastPosition, string> = {
  'top-right': 'top-4 right-4 items-end',
  'top-left': 'top-4 left-4 items-start',
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
};

export const ToastProvider: FC<ToastProviderProps> = ({
  children,
  position = 'bottom-right',
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  const addToast = (data: Omit<ToastData, 'id'> & { id?: string }): string => {
    const id = data.id || Math.random().toString(36).substring(2, 9);
    const newToast: ToastData = { ...data, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  };

  const toastMethods = Object.assign(
    (data: Omit<ToastData, 'id'> & { id?: string }) => addToast(data),
    {
      accent: (
        title: ReactNode,
        description?: ReactNode,
        options?: Partial<Omit<ToastData, 'id' | 'title' | 'description' | 'tone'>>
      ) => addToast({ title, description, tone: 'accent', ...options }),
      success: (
        title: ReactNode,
        description?: ReactNode,
        options?: Partial<Omit<ToastData, 'id' | 'title' | 'description' | 'tone'>>
      ) => addToast({ title, description, tone: 'success', ...options }),
      warning: (
        title: ReactNode,
        description?: ReactNode,
        options?: Partial<Omit<ToastData, 'id' | 'title' | 'description' | 'tone'>>
      ) => addToast({ title, description, tone: 'warning', ...options }),
      destructive: (
        title: ReactNode,
        description?: ReactNode,
        options?: Partial<Omit<ToastData, 'id' | 'title' | 'description' | 'tone'>>
      ) => addToast({ title, description, tone: 'destructive', ...options }),
    }
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        toast: toastMethods,
        dismissToast,
        clearAll,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} position={position} />
    </ToastContext.Provider>
  );
};

/* =========================================================================
   Toast Container
   ========================================================================= */

export interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
  position?: ToastPosition;
  className?: string;
}

export const ToastContainer: FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  position = 'bottom-right',
  className = '',
}) => {
  if (toasts.length === 0) return null;

  return (
    <aside
      role="region"
      aria-label="Notifications"
      style={{ zIndex: 'var(--z-toast, 70)' }}
      className={`fixed pointer-events-none flex flex-col gap-2 p-4 max-h-screen overflow-hidden ${positionStyles[position]} ${className}`}
    >
      {toasts.map((item) => (
        <Toast
          key={item.id}
          id={item.id}
          tone={item.tone}
          title={item.title}
          description={item.description}
          icon={item.icon}
          action={item.action}
          duration={item.duration}
          onDismiss={() => onDismiss(item.id)}
        />
      ))}
    </aside>
  );
};
