import type { ReactNode } from "react";

interface FieldShellProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** Rendered after the control on the same row (for example "speakers"). */
  suffix?: string;
  children: ReactNode;
}

export function hintId(id: string) {
  return `${id}-hint`;
}

export function errorId(id: string) {
  return `${id}-error`;
}

export function describedBy(id: string, hint?: string, error?: string) {
  const ids = [hint ? hintId(id) : null, error ? errorId(id) : null].filter(
    Boolean,
  );
  return ids.length > 0 ? ids.join(" ") : undefined;
}

export const controlClasses = (error?: string) =>
  `w-full rounded-m3-sm border bg-surface px-3 py-2 text-body-large text-on-surface focus:outline-none ${
    error
      ? "border-error focus:border-2 focus:border-error"
      : "border-outline focus:border-2 focus:border-primary"
  }`;

export function FieldShell({
  id,
  label,
  hint,
  error,
  suffix,
  children,
}: FieldShellProps) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-6">
      <label
        htmlFor={id}
        className="pt-2 text-label-large font-medium text-on-surface sm:text-right"
      >
        {label}
      </label>
      <div>
        <div className="flex items-center gap-3">
          {children}
          {suffix && (
            <span className="text-label-large font-medium text-on-surface">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <p id={errorId(id)} className="mt-1 text-body-medium text-error">
            {error}
          </p>
        )}
        {hint && (
          <p
            id={hintId(id)}
            className="mt-1 text-body-medium text-on-surface-variant"
          >
            {hint}
          </p>
        )}
      </div>
    </div>
  );
}
