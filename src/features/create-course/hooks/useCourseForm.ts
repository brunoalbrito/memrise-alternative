import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import {
  DEFAULT_SPEAKERS_LANGUAGE_ID,
  useLearnerStore,
  type CourseDraft,
} from "../../home";
import {
  FIELD_ORDER,
  validateCourseForm,
  type FieldName,
  type FormErrors,
} from "../model/validation";

const STORAGE_ERROR = "Could not save your course on this device. Please try again.";

const initialValues: CourseDraft = {
  name: "",
  teachingLanguageId: "",
  speakersLanguageId: DEFAULT_SPEAKERS_LANGUAGE_ID,
  tagsInput: "",
  description: "",
  shortDescription: "",
};

function storageWritable(): boolean {
  try {
    localStorage.setItem("membetter.probe", "1");
    localStorage.removeItem("membetter.probe");
    return true;
  } catch {
    return false;
  }
}

export function useCourseForm() {
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
    try {
      useLearnerStore.getState().addCourse(values);
    } catch {
      submitted.current = false;
      setStorageError(STORAGE_ERROR);
      return;
    }
    setStorageError(null);
    navigate("/");
  };

  return { values, errors, storageError, setValue, registerRef, submit };
}
