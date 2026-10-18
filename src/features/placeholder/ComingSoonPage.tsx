import { Link } from "react-router";
import { TopAppBar } from "../home";

interface ComingSoonPageProps {
  title: string;
  course?: string;
}

export function ComingSoonPage({ title, course }: ComingSoonPageProps) {
  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar />
      <main className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-headline-medium text-on-surface">{title}</h1>
        {course && (
          <p className="text-title-medium text-on-surface-variant">{course}</p>
        )}
        <p className="text-body-large text-on-surface-variant">
          This screen is coming soon.
        </p>
        <Link
          to="/"
          className="inline-flex h-10 items-center rounded-full bg-primary px-6 text-label-large font-medium text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Back to Home
        </Link>
      </main>
    </div>
  );
}
