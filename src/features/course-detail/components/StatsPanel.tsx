import { useEffect, useState } from "react";
import type { CourseStats } from "../../../../electron/shared/api";
import { getApi, isDesktop } from "../../../shared/api";
import { useProgressStore } from "../../home";

const weekday = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });

/** Personal statistics: streak, recall rate and reviews per day. */
export function StatsPanel({ courseId }: { courseId: string }) {
  const [stats, setStats] = useState<CourseStats | null>(null);
  const asOf = useProgressStore((state) => state.asOf);

  useEffect(() => {
    if (!isDesktop()) return;
    let cancelled = false;
    void getApi()
      .study.stats(courseId)
      .then((result) => {
        if (!cancelled && result.ok) setStats(result.data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [courseId, asOf]);

  const max = Math.max(1, ...(stats?.last14.map((d) => d.reviews) ?? [1]));

  return (
    <section aria-label="Your statistics" className="rounded-m3-lg bg-surface-container p-4">
      <h2 className="mb-3 text-title-large text-on-surface">Your statistics</h2>
      {!isDesktop() ? (
        <p className="text-body-medium text-on-surface-variant">Statistics are available in the desktop app.</p>
      ) : !stats ? (
        <p className="text-body-medium text-on-surface-variant">Loading…</p>
      ) : stats.totalReviews === 0 ? (
        <p className="text-body-medium text-on-surface-variant">Practice this course to see your streak and recall rate.</p>
      ) : (
        <>
          <dl className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-m3-md bg-surface-container-high px-2 py-3">
              <dd className="text-headline-medium text-on-surface">{stats.streakDays}</dd>
              <dt className="text-label-medium text-on-surface-variant">Day streak</dt>
            </div>
            <div className="rounded-m3-md bg-surface-container-high px-2 py-3">
              <dd className="text-headline-medium text-on-surface">{stats.recallPercent === null ? "–" : `${stats.recallPercent}%`}</dd>
              <dt className="text-label-medium text-on-surface-variant">Recall, 30 days</dt>
            </div>
            <div className="rounded-m3-md bg-surface-container-high px-2 py-3">
              <dd className="text-headline-medium text-on-surface">{stats.totalReviews}</dd>
              <dt className="text-label-medium text-on-surface-variant">Answers</dt>
            </div>
          </dl>
          <h3 className="mb-2 mt-4 text-label-large font-medium text-on-surface-variant">Answers per day, last 14 days</h3>
          <ol className="flex h-24 items-end gap-1" aria-label="Answers per day">
            {stats.last14.map((d) => (
              <li key={d.day} className="flex h-full flex-1 flex-col justify-end" aria-label={`${weekday(d.day)} ${d.day}: ${d.reviews}`}>
                <div className="rounded-t-sm bg-primary" style={{ height: `${(d.reviews / max) * 100}%`, minHeight: d.reviews > 0 ? 4 : 1 }} aria-hidden="true" />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
