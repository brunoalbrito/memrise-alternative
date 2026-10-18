import type { Ref } from "react";
import { FieldShell, controlClasses, describedBy } from "./FieldShell";

interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  inputRef?: Ref<HTMLTextAreaElement>;
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  hint,
  error,
  inputRef,
}: TextAreaFieldProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <textarea
        id={id}
        ref={inputRef}
        rows={5}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={`${controlClasses(error)} resize-y`}
      />
    </FieldShell>
  );
}
