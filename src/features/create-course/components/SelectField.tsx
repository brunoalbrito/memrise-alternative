import type { Ref } from "react";
import { FieldShell, controlClasses, describedBy } from "./FieldShell";

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  suffix?: string;
  hint?: string;
  error?: string;
  inputRef?: Ref<HTMLSelectElement>;
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  suffix,
  hint,
  error,
  inputRef,
}: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} suffix={suffix}>
      <select
        id={id}
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${controlClasses(error)} ${suffix ? "w-auto min-w-48" : ""}`}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}
