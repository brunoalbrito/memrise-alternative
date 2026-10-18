import { Link, useParams } from "react-router";
import { useCourseDetail } from "../course-detail";
import { TopAppBar } from "../home";
import { EditorHeader, type EditorTab } from "./components/EditorHeader";
import { DetailsTab } from "./components/DetailsTab";
import { LevelsTab } from "./components/LevelsTab";
import { TabPlaceholder } from "./components/TabPlaceholder";

export function CourseEditorPage({ tab }: { tab: EditorTab }) {
  const { id = "" } = useParams();
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
      <EditorHeader
        title={course.title}
        creator={detail.creator}
        courseId={course.id}
        levelCount={detail.levels.length}
        activeTab={tab}
      />
      <main className="mx-auto max-w-6xl px-4 pb-12 pt-6">
        {tab === "levels" && <LevelsTab course={course} />}
        {tab === "details" && <DetailsTab course={course} />}
        {tab === "databases" && <TabPlaceholder name="Databases" />}
        {tab === "contributors" && <TabPlaceholder name="Contributors" />}
      </main>
    </div>
  );
}
