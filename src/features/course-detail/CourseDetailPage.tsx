import { Link, useNavigate, useParams } from "react-router";
import { TopAppBar } from "../home";
import { CourseHeader } from "./components/CourseHeader";
import { LeaderboardPanel } from "./components/LeaderboardPanel";
import { LevelsSection } from "./components/LevelsSection";
import { ProgressSummary } from "./components/ProgressSummary";
import { useCourseDetail } from "./hooks/useCourseDetail";

export function CourseDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const detail = useCourseDetail(id);

  if (!detail) {
    return (
      <div className="min-h-screen bg-surface">
        <TopAppBar />
        <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
          <h1 className="text-headline-medium text-on-surface">
            Course not found
          </h1>
          <Link
            to="/"
            className="text-label-large font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Back to Home
          </Link>
        </main>
      </div>
    );
  }

  const { course } = detail;

  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar />
      <CourseHeader
        title={course.title}
        path={detail.path}
        symbol={detail.symbol}
        creator={detail.creator}
        onTweet={() => navigate(`/course/${course.id}/share`)}
      />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-4">
        <Link
          to="/"
          className="mb-4 inline-block text-label-large font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Back to Home
        </Link>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="flex min-w-0 flex-col gap-6">
            <ProgressSummary
              course={course}
              percent={detail.percent}
              longTermCount={detail.longTermCount}
              ignoredCount={detail.ignoredCount}
              dueCount={detail.dueCount}
              goal={detail.goal}
            />
            <LevelsSection
              courseId={course.id}
              levels={detail.levels}
              editHref={`/course/${course.id}/edit`}
            />
          </div>
          <LeaderboardPanel courseId={course.id} />
        </div>
      </main>
    </div>
  );
}
