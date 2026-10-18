import { Link } from "react-router";
import { TopAppBar } from "../home";
import { CourseForm } from "./components/CourseForm";
import { HelpPanel } from "./components/HelpPanel";

export function CreateCoursePage() {
  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar />
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-8">
        <div className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          <h1 className="text-headline-medium text-on-surface">
            Create a Course
          </h1>
          <Link
            to="/"
            className="text-label-large font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Back to Home
          </Link>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <CourseForm />
          <HelpPanel />
        </div>
      </main>
    </div>
  );
}
