import { Button } from "../../../shared/ui/Button";

interface EmptyStateProps {
  message: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-m3-lg bg-surface-container px-6 py-12 text-center">
      <p className="text-title-medium text-on-surface">{message}</p>
      <Button variant="tonal" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
