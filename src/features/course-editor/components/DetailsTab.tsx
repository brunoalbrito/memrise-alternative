import { CourseForm, HelpPanel } from "../../create-course";
import { draftFromCourse, useLearnerStore, type Course } from "../../home";

export function DetailsTab({ course }: { course: Course }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <CourseForm
        key={course.id}
        initialValues={draftFromCourse(course)}
        onSubmit={(values) => {
          useLearnerStore.getState().updateCourse(course.id, values);
        }}
        successPath={`/course/${course.id}/edit/details`}
        submitLabel="Save Changes"
      />
      <HelpPanel />
    </div>
  );
}
