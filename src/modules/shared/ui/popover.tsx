'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useClickOutside, useEscapeKey } from './hooks';
import { Panel } from './primitives';

export interface PopoverTriggerState {
  open: boolean;
  onClick: () => void;
}

export interface PopoverProps {
  renderTrigger: (state: PopoverTriggerState) => ReactNode;
  children: ReactNode | ((state: { close: () => void }) => ReactNode);
  align?: 'left' | 'right';
  panelClassName?: string;
  containerClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Floating panel that closes on outside click and Escape — replaces native
 * <details>/<summary> dropdowns, which don't close on outside click.
 * `renderTrigger` gives the caller full control of trigger markup/icons and
 * makes it responsible for its own aria-haspopup/aria-expanded; the trigger
 * and panel share one relatively-positioned container so a click on the
 * trigger itself is never mistaken for an outside click.
 * Positioned with a plain `absolute` (no Floating UI/Popper dependency) —
 * fine for this app's bounded, non-edge-of-viewport header dropdowns.
 */
export function Popover({ renderTrigger, children, align = 'right', panelClassName = 'top-11 w-64', containerClassName = '', open: openProp, onOpenChange }: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = openProp ?? uncontrolledOpen;
  const containerRef = useRef<HTMLDivElement>(null);

  function setOpen(next: boolean) {
    setUncontrolledOpen(next);
    onOpenChange?.(next);
  }

  useClickOutside(containerRef, () => setOpen(false), open);
  useEscapeKey(() => setOpen(false), open);

  return (
    <div ref={containerRef} className={`relative ${containerClassName}`}>
      {renderTrigger({ open, onClick: () => setOpen(!open) })}
      {open ? (
        <Panel className={`absolute z-40 overflow-hidden shadow-lg ${align === 'right' ? 'right-0' : 'left-0'} ${panelClassName}`}>
          {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
        </Panel>
      ) : null}
    </div>
  );
}
