import { Link } from "react-router";
import { Button } from "../../../../shared/ui/Button";
import { ArrowDropDownIcon, EditIcon } from "../../../../shared/ui/icons";
import { Menu, type MenuItem } from "../../../../shared/ui/Menu";
import { mainActionLabel, type MainAction } from "../../model/levelStats";
import { PlantIcon } from "../PlantIcon";

interface LevelHeaderProps {
  courseId: string;
  levelId: string;
  number: number;
  name: string;
  stage: "pot" | "growing" | "flower";
  learned: number;
  total: number;
  action: MainAction;
  onOption: (id: "edit" | "ignore-all" | "restore-all") => void;
}

const options: MenuItem[] = [
  { kind: "item", id: "edit", label: "Edit level" },
  { kind: "item", id: "ignore-all", label: "Ignore all words" },
  { kind: "item", id: "restore-all", label: "Restore all words" },
];

const small =
  "inline-flex h-9 items-center gap-2 rounded-m3-sm border border-outline-variant bg-surface px-3 text-label-large font-medium text-on-surface hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function LevelHeader({ courseId, levelId, number, name, stage, learned, total, action, onOption }: LevelHeaderProps) {
  const percent = total === 0 ? 0 : Math.round((learned / total) * 100);
  const route = action.kind === "review" ? "review" : "learn";

  return (
    <section aria-label={`Level ${number}`} className="rounded-m3-lg bg-surface-container-high p-4 sm:p-6">
      <div className="flex gap-4 sm:gap-6">
        <div className="flex w-20 shrink-0 flex-col items-center">
          <span className="text-title-medium text-on-surface-variant">Level {number}</span>
          <PlantIcon stage={stage} className="mt-1 size-20" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 break-words text-headline-medium text-on-surface">{name}</h1>
            <Link to={`/course/${courseId}/edit`} className={small}>
              <EditIcon className="size-4" />
              Edit Level
            </Link>
          </div>
          <div
            role="progressbar"
            aria-label="Words learned in this level"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={learned}
            aria-valuetext={`${learned} of ${total} words learned`}
            className="mt-3 h-3 overflow-hidden rounded-full bg-surface-variant"
          >
            <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1 text-label-medium text-on-surface-variant">
            {learned} of {total} learned
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Menu
              label="Level options"
              items={options}
              onSelect={(id) => onOption(id as "edit" | "ignore-all" | "restore-all")}
              trigger={(props) => (
                <button type="button" className={small} {...props}>
                  Options
                  <ArrowDropDownIcon />
                </button>
              )}
            />
            {action.kind === "none" ? (
              <Button variant="filled" disabled>
                {mainActionLabel(action)}
              </Button>
            ) : (
              <Link
                to={`/course/${courseId}/${route}?level=${encodeURIComponent(levelId)}`}
                className="inline-flex h-10 items-center rounded-full bg-primary px-6 text-label-large font-medium text-on-primary hover:shadow-m3-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {mainActionLabel(action)}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
