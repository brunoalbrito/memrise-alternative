import type { Ref } from "react";
import { FieldShell, controlClasses, describedBy } from "./FieldShell";

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  inputRef?: Ref<HTMLInputElement>;
}

export function TextField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  inputRef,
}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={controlClasses(error)}
      />
    </FieldShell>
  );
}
