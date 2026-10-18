import { Link, useParams } from "react-router";
import { CourseForm, HelpPanel } from "../create-course";
import {
  TopAppBar,
  draftFromCourse,
  useCourse,
  useLearnerStore,
} from "../home";

const linkClasses =
  "text-label-large font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function EditCoursePage() {
  const { id = "" } = useParams();
  const course = useCourse(id);
  const removed = useLearnerStore((state) => state.removedCourseIds);

  if (!course || removed.includes(course.id)) {
    return (
      <div className="min-h-screen bg-surface">
        <TopAppBar />
        <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
          <h1 className="text-headline-medium text-on-surface">
            Course not found
          </h1>
          <Link to="/" className={linkClasses}>
            Back to Home
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-8">
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <h1 className="text-headline-medium text-on-surface">Edit Course</h1>
          <Link to={`/course/${course.id}`} className={linkClasses}>
            Back to course
          </Link>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <CourseForm
            key={course.id}
            initialValues={draftFromCourse(course)}
            onSubmit={(values) => {
              useLearnerStore.getState().updateCourse(course.id, values);
            }}
            successPath={`/course/${course.id}`}
            submitLabel="Save Changes"
          />
          <HelpPanel />
        </div>
      </main>
    </div>
  );
}
