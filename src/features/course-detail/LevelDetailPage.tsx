import { Link, useNavigate, useParams } from "react-router";
import { TopAppBar } from "../home";
import { LevelHeader } from "./components/level/LevelHeader";
import { LevelNav } from "./components/level/LevelNav";
import { LevelTopBar } from "./components/level/LevelTopBar";
import { WordList } from "./components/level/WordList";
import { useLevelDetail } from "./hooks/useLevelDetail";

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

/** One level of a course: its progress, the words with their status, and the way to practice them. */
export function LevelDetailPage() {
  const { id = "", level: levelParam = "" } = useParams();
  const navigate = useNavigate();
  const detail = useLevelDetail(id, levelParam);

  if (!detail.course) return <Message title="Course not found" to="/" linkLabel="Back to Home" />;
  if (!detail.level) return <Message title="Level not found" to={`/course/${id}`} linkLabel="Back to course" />;

  const { level, rows, stats } = detail;
  const ignoreAll = (ignored: boolean) => {
    const ids = rows.filter((row) => row.status.ignored !== ignored).map((row) => row.word.id);
    void detail.setIgnored(ids, ignored);
  };

  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar />
      <LevelTopBar courseId={id} levelCount={detail.levels.length} />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-6">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_11rem]">
          <div className="flex min-w-0 flex-col gap-4">
            <LevelHeader
              courseId={id}
              levelId={level.id}
              number={detail.number}
              name={level.name}
              stage={detail.stage}
              learned={stats.learned}
              total={stats.total}
              action={detail.action}
              onOption={(option) => {
                if (option === "edit") navigate(`/course/${id}/edit`);
                else ignoreAll(option === "ignore-all");
              }}
            />
            <div className="flex items-center justify-between px-1 text-body-large text-on-surface-variant">
              <span>
                {stats.total} {stats.total === 1 ? "word" : "words"}
              </span>
              <span>{stats.ignored} ignored</span>
            </div>
            <WordList key={level.id} rows={rows} now={detail.now} onIgnore={(ids, ignored) => void detail.setIgnored(ids, ignored)} />
          </div>
          <LevelNav courseId={id} previous={detail.previous} next={detail.next} />
        </div>
      </main>
    </div>
  );
}
