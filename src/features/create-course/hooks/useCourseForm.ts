import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { storageWritable } from "../../../shared/storage/storageWritable";
import { CourseNotFoundError, type CourseDraft } from "../../home";
import {
  FIELD_ORDER,
  validateCourseForm,
  type FieldName,
  type FormErrors,
} from "../model/validation";

const STORAGE_ERROR = "Could not save your course on this device. Please try again.";

interface UseCourseFormOptions {
  initialValues: CourseDraft;
  onSubmit: (values: CourseDraft) => string | void;
  successPath: string;
}

export function useCourseForm({
  initialValues,
  onSubmit,
  successPath,
}: UseCourseFormOptions) {
  const navigate = useNavigate();
  const [values, setValues] = useState<CourseDraft>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [storageError, setStorageError] = useState<string | null>(null);
  const submitted = useRef(false);
  const fieldRefs = useRef<Partial<Record<FieldName, HTMLElement | null>>>({});

  useEffect(() => {
    fieldRefs.current.name?.focus();
  }, []);

  const registerRef = (name: FieldName) => (element: HTMLElement | null) => {
    fieldRefs.current[name] = element;
  };

  const setValue = (name: keyof CourseDraft, value: string) => {
    const next = { ...values, [name]: value };
    setValues(next);
    if (name in errors) {
      const fresh = validateCourseForm(next)[name as FieldName];
      setErrors((current) => {
        const copy = { ...current };
        if (fresh) copy[name as FieldName] = fresh;
        else delete copy[name as FieldName];
        return copy;
      });
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (submitted.current) return;

    const found = validateCourseForm(values);
    setErrors(found);
    const firstInvalid = FIELD_ORDER.find((name) => found[name]);
    if (firstInvalid) {
      fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    if (!storageWritable()) {
      setStorageError(STORAGE_ERROR);
      return;
    }

    submitted.current = true;
    let destination = successPath;
    try {
      const result = onSubmit(values);
      if (typeof result === "string") destination = result;
    } catch (error) {
      if (error instanceof CourseNotFoundError) {
        // The destination page shows "Course not found".
        navigate(successPath);
        return;
      }
      submitted.current = false;
      setStorageError(STORAGE_ERROR);
      return;
    }
    setStorageError(null);
    navigate(destination);
    // When the destination is this same page (Details tab), allow saving again later.
    window.setTimeout(() => {
      submitted.current = false;
    }, 600);
  };

  return { values, errors, storageError, setValue, registerRef, submit };
}
