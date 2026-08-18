'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useEscapeKey } from './hooks';
import { Panel } from './primitives';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  labelledBy?: string;
  describedBy?: string;
}

/**
 * Always mount this conditionally ({open ? <Modal ...> : null}), never
 * keep-mounted-and-hidden — that's what makes createPortal(document.body)
 * safe here, since it then never runs during the SSR pass.
 *
 * No cyclic Tab focus-trap: hand-rolling one correctly (dynamic tabbable
 * queries, edge cases) is disproportionate for this app's short-lived,
 * single-action dialogs. Scoped down deliberately, not an oversight.
 */
export function Modal({
  open, onClose, children, className = 'w-full max-w-md',
  closeOnBackdropClick = true, closeOnEscape = true, labelledBy, describedBy,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  useEscapeKey(onClose, open && closeOnEscape);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (previouslyFocused.current instanceof HTMLElement) previouslyFocused.current.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-neutral/40 p-4" onClick={closeOnBackdropClick ? onClose : undefined}>
      <Panel className={`shadow-lg ${className}`}>
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          tabIndex={-1}
          onClick={(event) => event.stopPropagation()}
          className="outline-none"
        >
          {children}
        </div>
      </Panel>
    </div>,
    document.body,
  );
}
