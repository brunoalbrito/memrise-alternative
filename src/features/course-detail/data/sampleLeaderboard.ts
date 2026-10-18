export type LeaderboardPeriod = "week" | "month" | "all";

export interface LeaderboardEntry {
  /** Unique within a period. The current learner is `you`. */
  id: string;
  name: string;
  /** Integer >= 0 */
  points: number;
}

export const sampleLeaderboard: Record<LeaderboardPeriod, LeaderboardEntry[]> = {
  week: [
    { id: "maya", name: "Maya R.", points: 120 },
    { id: "chen", name: "Chen W.", points: 95 },
    { id: "luis", name: "Luis G.", points: 95 },
    { id: "sara", name: "Sara K.", points: 60 },
    { id: "you", name: "You", points: 0 },
  ],
  month: [
    { id: "maya", name: "Maya R.", points: 410 },
    { id: "luis", name: "Luis G.", points: 380 },
    { id: "chen", name: "Chen W.", points: 300 },
    { id: "sara", name: "Sara K.", points: 150 },
    { id: "you", name: "You", points: 40 },
  ],
  all: [
    { id: "chen", name: "Chen W.", points: 2100 },
    { id: "maya", name: "Maya R.", points: 1900 },
    { id: "luis", name: "Luis G.", points: 1500 },
    { id: "sara", name: "Sara K.", points: 900 },
    { id: "you", name: "You", points: 190 },
  ],
};
