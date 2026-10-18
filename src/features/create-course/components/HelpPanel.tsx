import { Link } from "react-router";

export function HelpPanel() {
  return (
    <aside
      aria-label="Course creation help"
      className="rounded-m3-lg bg-surface-container p-6"
    >
      <h2 className="text-title-large text-on-surface">Why create a course?</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-body-medium text-on-surface">
        <li>A quick list of personal facts to remember</li>
        <li>Share common content with your classmates/colleagues</li>
        <li>Share awesome teaching materials with the community!</li>
      </ul>
      <h2 className="mt-6 text-title-large text-on-surface">Need more help?</h2>
      <p className="mt-2 text-body-medium text-on-surface">
        Check out the{" "}
        <Link
          to="/help/course-creation"
          className="text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Course Creation knowledge base
        </Link>
        .
      </p>
    </aside>
  );
}
