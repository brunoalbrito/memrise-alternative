import { Link, useParams } from "react-router";
import { TopAppBar, useCourse } from "../home";
import { ComingSoonPage } from "./ComingSoonPage";

export function CoursePlaceholder({ title }: { title: string }) {
  const { id = "" } = useParams();
  const course = useCourse(id);

  if (!course) {
    return (
      <div className="min-h-screen bg-surface">
        <TopAppBar />
        <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
          <h1 className="text-headline-medium text-on-surface">
            Course not found
          </h1>
          <Link to="/" className="text-label-large font-medium text-primary underline">
            Back to Home
          </Link>
        </main>
      </div>
    );
  }

  return <ComingSoonPage title={title} course={course.title} />;
}
