import { useEffect, useRef, useId, type ReactNode, type RefObject, type FC } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  initialFocusRef?: RefObject<HTMLElement | null>;
  className?: string;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-5xl w-full',
};

export const Modal: FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  initialFocusRef,
  className = '',
}) => {
  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descId = `${modalId}-desc`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore focus when closing
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    // Focus initial element or first focusable element
    const timer = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          focusable[0].focus();
        }
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElementRef.current?.focus();
    };
  }, [isOpen, onClose, initialFocusRef]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-150 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`glass-modal rounded-2xl w-full ${sizeClasses[size]} shadow-2xl overflow-hidden flex flex-col my-auto border border-white/10 ${className}`}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md">
          <div className="pr-4">
            <h2 id={titleId} className="font-headline font-bold text-lg text-white">
              {title}
            </h2>
            {description && (
              <p id={descId} className="font-mono text-xs text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          <IconButton
            icon={<X className="w-4 h-4" />}
            aria-label="Close dialog"
            size="md"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          />
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto max-h-[calc(85vh-120px)]">{children}</div>

        {/* Modal Footer (Optional) */}
        {footer && (
          <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-white/5 backdrop-blur-md">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
