import { useState } from "react";
import { Link } from "react-router";
import {
  sampleLeaderboard,
  type LeaderboardPeriod,
} from "../data/sampleLeaderboard";
import { rankEntries } from "../model/leaderboard";
import { Tabs } from "./Tabs";

const periods: { id: LeaderboardPeriod; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "all", label: "All Time" },
];

export function LeaderboardPanel({ courseId }: { courseId: string }) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("week");
  const rows = rankEntries(sampleLeaderboard[period]);

  return (
    <section
      aria-label="Leaderboard"
      className="rounded-m3-lg bg-surface-container p-4"
    >
      <h2 className="mb-2 text-title-large text-on-surface">Leaderboard</h2>
      <Tabs
        label="Leaderboard period"
        tabs={periods}
        selectedId={period}
        onSelect={(id) => setPeriod(id as LeaderboardPeriod)}
      >
        <ol className="flex flex-col gap-1">
          {rows.map((row) => (
            <li
              key={row.id}
              aria-current={row.id === "you" ? "true" : undefined}
              className={`flex items-center gap-3 rounded-m3-sm px-3 py-2 text-body-medium ${
                row.id === "you"
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface"
              }`}
            >
              <span className="w-6 font-medium">{row.rank}</span>
              <span className="flex-1">{row.name}</span>
              <span className="font-medium">{row.points}</span>
            </li>
          ))}
        </ol>
      </Tabs>
      <div className="mt-3 text-center">
        <Link
          to={`/course/${courseId}/leaderboard`}
          className="text-label-large font-medium text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          More
        </Link>
      </div>
    </section>
  );
}
