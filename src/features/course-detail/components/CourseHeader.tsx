import { Link } from "react-router";
import { Button } from "../../../shared/ui/Button";
import type { Crumb } from "../model/breadcrumb";

interface CourseHeaderProps {
  title: string;
  path: Crumb[];
  symbol: string;
  creator: string;
  onTweet: () => void;
}

export function CourseHeader({
  title,
  path,
  symbol,
  creator,
  onTweet,
}: CourseHeaderProps) {
  return (
    <header className="bg-surface-container-high">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:flex-row sm:items-start">
        <div
          aria-hidden="true"
          className="flex size-28 shrink-0 items-center justify-center rounded-m3-lg bg-primary-container text-6xl sm:size-36"
        >
          {symbol}
        </div>
        <div className="min-w-0 flex-1">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-x-2 text-label-large text-on-surface-variant">
              {path.map((crumb, index) => {
                const last = index === path.length - 1;
                return (
                  <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                    {crumb.to && !last ? (
                      <Link
                        to={crumb.to}
                        className="underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span aria-current={last ? "page" : undefined}>
                        {crumb.label}
                      </span>
                    )}
                    {!last && <span aria-hidden="true">&gt;</span>}
                  </li>
                );
              })}
            </ol>
          </nav>
          <h1 className="mt-2 break-words text-headline-medium text-on-surface">
            {title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <p className="text-body-medium text-on-surface-variant">
              Created by{" "}
              <span className="font-medium text-on-surface">{creator}</span>
            </p>
            <Button variant="tonal" onClick={onTweet}>
              Tweet
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
