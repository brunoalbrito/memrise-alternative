import { Button } from "../../../shared/ui/Button";
import { languages, type CourseDraft } from "../../home";
import { useCourseForm } from "../hooks/useCourseForm";
import { SelectField } from "./SelectField";
import { TextAreaField } from "./TextAreaField";
import { TextField } from "./TextField";

const languageOptions = languages.map((language) => ({
  value: language.id,
  label: language.name,
}));

interface CourseFormProps {
  initialValues: CourseDraft;
  onSubmit: (values: CourseDraft) => void;
  successPath: string;
  submitLabel: string;
}

export function CourseForm({
  initialValues,
  onSubmit,
  successPath,
  submitLabel,
}: CourseFormProps) {
  const { values, errors, storageError, setValue, registerRef, submit } =
    useCourseForm({ initialValues, onSubmit, successPath });

  return (
    <form
      noValidate
      onSubmit={submit}
      className="flex flex-col gap-6 rounded-m3-lg bg-surface-container p-6"
    >
      <TextField
        id="course-name"
        label="Name"
        value={values.name}
        onChange={(value) => setValue("name", value)}
        hint="Naming your course well will help other learners find it."
        error={errors.name}
        inputRef={registerRef("name")}
      />
      <SelectField
        id="course-teaching"
        label="Teaching"
        value={values.teachingLanguageId}
        onChange={(value) => setValue("teachingLanguageId", value)}
        options={languageOptions}
        placeholder="Please select one..."
        error={errors.teachingLanguageId}
        inputRef={registerRef("teachingLanguageId")}
      />
      <SelectField
        id="course-for"
        label="For"
        value={values.speakersLanguageId}
        onChange={(value) => setValue("speakersLanguageId", value)}
        options={languageOptions}
        suffix="speakers"
      />
      <TextField
        id="course-tags"
        label="Tags"
        value={values.tagsInput}
        onChange={(value) => setValue("tagsInput", value)}
        hint="E.g. Spanish vocabulary, learn spanish online, spanish grammar"
        error={errors.tagsInput}
        inputRef={registerRef("tagsInput")}
      />
      <TextAreaField
        id="course-description"
        label="Description"
        value={values.description}
        onChange={(value) => setValue("description", value)}
        hint="Keep the description of the course in the language of what the learners speak."
        error={errors.description}
        inputRef={registerRef("description")}
      />
      <TextField
        id="course-short-description"
        label="Short description"
        value={values.shortDescription}
        onChange={(value) => setValue("shortDescription", value)}
        hint="A short description for our apps."
        error={errors.shortDescription}
        inputRef={registerRef("shortDescription")}
      />
      <div className="flex flex-col items-center gap-3 border-t border-dashed border-outline-variant pt-6">
        {storageError && (
          <p role="alert" className="text-body-medium text-error">
            {storageError}
          </p>
        )}
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
