interface SkippedFieldBadgeProps {
  isSkipped: boolean;
}

/**
 * Badge indicating field was skipped during AI generation (already filled manually).
 * M3 design: secondary color, shape-small, inline display.
 */
export function SkippedFieldBadge({ isSkipped }: SkippedFieldBadgeProps) {
  if (!isSkipped) return null;

  return (
    <span
      className="ml-2 inline-flex items-center gap-1 rounded-m3-sm bg-secondary-container px-2 py-1 text-label-small font-medium text-on-secondary-container"
      title="This field was not regenerated (already filled manually)"
    >
      ↷ skipped
    </span>
  );
}
