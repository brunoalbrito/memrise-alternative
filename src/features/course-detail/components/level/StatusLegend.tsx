import { BoltIcon, VisibilityIcon, WaterDropIcon } from "../../../../shared/ui/icons";

/** What the markers on the word rows mean. */
export function StatusLegend() {
  return (
    <ul aria-label="Legend" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-label-medium text-on-surface-variant">
      <li className="inline-flex items-center gap-1">
        <VisibilityIcon className="size-4" /> Ready to learn
      </li>
      <li className="inline-flex items-center gap-1">
        <WaterDropIcon className="size-4" /> Ready to review
      </li>
      <li className="inline-flex items-center gap-1">
        <BoltIcon className="size-4" /> Difficult
      </li>
    </ul>
  );
}
