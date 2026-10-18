import { FlagIcon } from "../../../shared/ui/icons";

interface GoalRingProps {
  /** 0 to 1; undefined means no goal is set. */
  progress?: number;
  value: number;
}

const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function GoalRing({ progress, value }: GoalRingProps) {
  const dimmed = progress === undefined || value === 0;
  return (
    <div
      className={`flex items-center gap-2 ${dimmed ? "opacity-50" : ""}`}
      role="progressbar"
      aria-label="Daily goal"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round((progress ?? 0) * 100)}
      aria-valuetext={
        progress === undefined
          ? `No goal set, ${value} learned today`
          : `${Math.round(progress * 100)}% of daily goal`
      }
    >
      <span className="relative flex size-10 items-center justify-center">
        <svg viewBox="0 0 40 40" className="absolute inset-0 size-10 -rotate-90">
          <circle
            cx="20"
            cy="20"
            r={RADIUS}
            fill="none"
            strokeWidth="4"
            className="stroke-primary-container"
          />
          {progress !== undefined && (
            <circle
              cx="20"
              cy="20"
              r={RADIUS}
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              className="stroke-primary"
            />
          )}
        </svg>
        <FlagIcon className="size-4 text-primary" />
      </span>
      <span className="text-label-large font-medium text-on-surface">{value}</span>
    </div>
  );
}
