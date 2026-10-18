import type { LeaderboardEntry } from "../data/sampleLeaderboard";

export type RankedEntry = LeaderboardEntry & { rank: number };

/** Sort by points descending, then name ascending. Equal points share a rank (1, 1, 3). */
export function rankEntries(entries: LeaderboardEntry[]): RankedEntry[] {
  const sorted = [...entries].sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name),
  );
  return sorted.map((entry) => {
    const first = sorted.findIndex((other) => other.points === entry.points);
    return { ...entry, rank: first + 1 };
  });
}
