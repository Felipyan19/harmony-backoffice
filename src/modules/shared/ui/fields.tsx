import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export type TextFieldType = 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'search';
export type FieldSize = 'sm' | 'lg';

const wrapSizeClass: Record<FieldSize, string> = {
  sm: 'h-9 gap-2 rounded-md px-3',
  lg: 'min-h-13 gap-3 rounded-xl px-4',
};

const inputSizeClass: Record<FieldSize, string> = {
  sm: 'text-sm',
  lg: 'py-3 text-base',
};

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  type?: TextFieldType;
  size?: FieldSize;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  containerClassName?: string;
}

/**
 * Single field component for text/email/password/tel/number/date/search —
 * the differences between those types are a handful of HTML attributes, not
 * enough divergence to justify separate components per type. No useId(): id
 * falls back to `name`, which every field in this app already has (Server
 * Actions read FormData by name), so this stays usable from Server Components.
 */
export function TextField({
  label, hint, error, type = 'text', size = 'sm', startAdornment, endAdornment,
  containerClassName = '', className = '', id, name, ...props
}: TextFieldProps) {
  const fieldId = id ?? name;
  const messageId = fieldId && (error || hint) ? `${fieldId}-message` : undefined;
  const numberDefaults = type === 'number' ? { inputMode: 'numeric' as const } : undefined;

  return (
    <div className={containerClassName}>
      {label ? <label htmlFor={fieldId} className="mb-2 block text-sm font-medium text-neutral/80">{label}</label> : null}
      <span className={`flex items-center border bg-neutral/4 text-neutral/40 transition focus-within:bg-white focus-within:ring-4 ${wrapSizeClass[size]} ${error ? 'border-danger/40 focus-within:border-danger/40 focus-within:ring-danger/12' : 'border-neutral/15 focus-within:border-primary/40 focus-within:ring-primary/12'}`}>
        {startAdornment}
        <input
          id={fieldId}
          name={name}
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          className={`min-w-0 flex-1 bg-transparent text-neutral outline-none placeholder:text-neutral/40 disabled:text-neutral/40 ${inputSizeClass[size]} ${className}`}
          {...numberDefaults}
          {...props}
        />
        {endAdornment}
      </span>
      {error ? <p id={messageId} role="alert" className="mt-1 text-sm text-danger">{error}</p>
        : hint ? <p id={messageId} className="mt-1 text-sm text-neutral/40">{hint}</p> : null}
    </div>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export function Select({ label, hint, error, containerClassName = '', className = '', id, name, children, ...props }: SelectProps) {
  const fieldId = id ?? name;

  return (
    <div className={containerClassName}>
      {label ? <label htmlFor={fieldId} className="mb-2 block text-sm font-medium text-neutral/80">{label}</label> : null}
      <select
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        className={`h-9 rounded-md border bg-neutral/4 px-3 text-sm font-medium text-neutral/80 outline-none transition focus:bg-white focus:ring-4 ${error ? 'border-danger/40 focus:border-danger/40 focus:ring-danger/12' : 'border-neutral/15 focus:border-primary/40 focus:ring-primary/12'} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? <p role="alert" className="mt-1 text-sm text-danger">{error}</p>
        : hint ? <p className="mt-1 text-sm text-neutral/40">{hint}</p> : null}
    </div>
  );
}

export function Checkbox({ label, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral/80">
      <input type="checkbox" className={`h-4 w-4 rounded border-neutral/20 accent-primary ${className}`} {...props} />
      {label}
    </label>
  );
}
