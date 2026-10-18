import { Link, useParams } from "react-router";
import { TopAppBar } from "../home";
import { ComingSoonPage } from "../placeholder";
import { useCourseDetail } from "./hooks/useCourseDetail";

function Message({ title, to, linkLabel }: { title: string; to: string; linkLabel: string }) {
  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar />
      <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-headline-medium text-on-surface">{title}</h1>
        <Link
          to={to}
          className="text-label-large font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {linkLabel}
        </Link>
      </main>
    </div>
  );
}

export function LevelPlaceholder() {
  const { id = "", level = "" } = useParams();
  const detail = useCourseDetail(id);

  if (!detail) {
    return <Message title="Course not found" to="/" linkLabel="Back to Home" />;
  }

  const found = detail.levels.find((item) => String(item.number) === level);
  if (!found) {
    return (
      <Message
        title="Level not found"
        to={`/course/${id}`}
        linkLabel="Back to course"
      />
    );
  }

  return (
    <ComingSoonPage
      title={`Level ${found.number}: ${found.name}`}
      course={detail.course.title}
    />
  );
}
