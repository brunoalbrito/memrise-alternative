import { Link } from "react-router";

export type EditorTab = "levels" | "databases" | "contributors" | "details";

interface EditorHeaderProps {
  title: string;
  creator: string;
  courseId: string;
  levelCount: number;
  activeTab: EditorTab;
}

const linkBase =
  "inline-flex h-10 items-center rounded-full px-4 text-label-large font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function EditorHeader({
  title,
  creator,
  courseId,
  levelCount,
  activeTab,
}: EditorHeaderProps) {
  const base = `/course/${courseId}/edit`;
  const tabs: { id: EditorTab; label: string; to: string }[] = [
    { id: "levels", label: `Levels (${levelCount})`, to: base },
    { id: "databases", label: "Databases", to: `${base}/databases` },
    { id: "contributors", label: "Contributors", to: `${base}/contributors` },
    { id: "details", label: "Details", to: `${base}/details` },
  ];

  return (
    <header>
      <div className="bg-surface-container-high">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-4">
          <h1 className="min-w-0 break-words text-headline-medium text-on-surface">
            {title}
          </h1>
          <p className="text-body-medium text-on-surface-variant">
            Created by <span className="font-medium text-on-surface">{creator}</span>
          </p>
        </div>
      </div>
      <nav aria-label="Editing" className="border-b border-outline-variant bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-2">
          <span className="mr-2 text-title-medium font-medium text-on-surface">
            Editing
          </span>
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.to}
              aria-current={tab.id === activeTab ? "page" : undefined}
              className={`${linkBase} ${
                tab.id === activeTab
                  ? "bg-secondary-container text-on-secondary-container"
                  : "text-on-surface-variant hover:bg-on-surface/8"
              }`}
            >
              {tab.label}
            </Link>
          ))}
          <Link
            to={`/course/${courseId}`}
            className={`${linkBase} ml-auto text-on-surface-variant hover:bg-on-surface/8`}
          >
            Back to Course
          </Link>
        </div>
      </nav>
    </header>
  );
}
