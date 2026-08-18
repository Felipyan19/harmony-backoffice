'use client';

import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type OptionHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useClickOutside, useEscapeKey } from './hooks';
import { Panel } from './primitives';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

interface SelectOption {
  value: string;
  label: ReactNode;
  disabled: boolean;
}

function readOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement(child) || child.type !== 'option') return [];
    const optionProps = child.props as OptionHTMLAttributes<HTMLOptionElement>;
    return [{ value: String(optionProps.value ?? ''), label: optionProps.children, disabled: !!optionProps.disabled }];
  });
}

/**
 * Custom-styled stand-in for a native <select> — a real select's open option
 * list is drawn by the browser/OS and can't be restyled (rounded corners,
 * hover colors, etc.), so the visible listbox here is plain divs instead. A
 * hidden real <select> mirrors value/name/onChange so this still behaves like
 * a form field (e.g. inside a <form action={...}> Server Action) with no API
 * changes at call sites — they keep passing <option> children as before.
 */
export function Select({ label, hint, error, containerClassName = '', className = '', id, name, children, value, defaultValue, onChange, disabled, required, ...rest }: SelectProps) {
  const fieldId = id ?? name;
  const messageId = fieldId && (error || hint) ? `${fieldId}-message` : undefined;
  const options = useMemo(() => readOptions(children), [children]);
  const isControlled = value !== undefined;

  const [uncontrolledValue, setUncontrolledValue] = useState(() => (defaultValue !== undefined ? String(defaultValue) : options[0]?.value ?? ''));
  const displayValue = isControlled ? String(value) : uncontrolledValue;
  const selectedOption = options.find((option) => option.value === displayValue);

  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenSelectRef = useRef<HTMLSelectElement>(null);
  const optionRefs = useRef<Array<HTMLDivElement | null>>([]);

  useClickOutside(containerRef, () => setOpen(false), open);
  useEscapeKey(() => setOpen(false), open);

  useEffect(() => {
    if (open) optionRefs.current[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
  }, [open, highlightedIndex]);

  function openMenu() {
    if (disabled) return;
    const index = options.findIndex((option) => option.value === displayValue);
    setHighlightedIndex(index >= 0 ? index : 0);
    setOpen(true);
  }

  function selectOption(optionValue: string) {
    setOpen(false);
    if (!isControlled) setUncontrolledValue(optionValue);
    const node = hiddenSelectRef.current;
    if (!node) return;
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value')?.set;
    nativeSetter?.call(node, optionValue);
    node.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function moveHighlight(delta: number) {
    if (options.length === 0) return;
    let index = highlightedIndex;
    for (let step = 0; step < options.length; step++) {
      index = (index + delta + options.length) % options.length;
      if (!options[index].disabled) break;
    }
    setHighlightedIndex(index);
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openMenu();
      }
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveHighlight(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveHighlight(-1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const option = options[highlightedIndex];
      if (option && !option.disabled) selectOption(option.value);
    }
  }

  return (
    <div className={containerClassName}>
      {label ? <label htmlFor={fieldId} className="mb-2 block text-sm font-medium text-neutral/80">{label}</label> : null}
      <div ref={containerRef} className="relative inline-flex max-w-full">
        <button
          type="button"
          id={fieldId}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-describedby={messageId}
          onClick={() => (open ? setOpen(false) : openMenu())}
          onKeyDown={handleTriggerKeyDown}
          className={`flex h-9 max-w-full items-center gap-2 rounded-md border bg-neutral/4 px-3 text-left text-sm font-medium text-neutral/80 outline-none transition hover:bg-white focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${error ? 'border-danger/40 focus:border-danger/40 focus:ring-danger/12' : 'border-neutral/15 focus:border-primary/40 focus:ring-primary/12'} ${className}`}
        >
          <span className="min-w-0 flex-1 truncate">{selectedOption?.label}</span>
          <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-neutral/45" />
        </button>

        {open ? (
          <Panel role="listbox" aria-labelledby={fieldId} className="absolute top-full z-40 mt-1 max-h-60 w-full min-w-[8rem] overflow-auto p-1 shadow-lg">
            {options.map((option, index) => (
              <div
                key={option.value}
                ref={(node) => { optionRefs.current[index] = node; }}
                role="option"
                aria-selected={option.value === displayValue}
                aria-disabled={option.disabled || undefined}
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => !option.disabled && selectOption(option.value)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-sm font-medium transition ${option.disabled ? 'cursor-not-allowed text-neutral/30' : index === highlightedIndex ? 'bg-primary/8 text-neutral' : 'text-neutral/70'}`}
              >
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.value === displayValue ? <Check size={14} className="shrink-0 text-primary" /> : null}
              </div>
            ))}
          </Panel>
        ) : null}

        <select
          ref={hiddenSelectRef}
          name={name}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          required={required}
          hidden
          aria-hidden="true"
          tabIndex={-1}
          {...rest}
        >
          {children}
        </select>
      </div>
      {error ? <p id={messageId} role="alert" className="mt-1 text-sm text-danger">{error}</p>
        : hint ? <p id={messageId} className="mt-1 text-sm text-neutral/40">{hint}</p> : null}
    </div>
  );
}
