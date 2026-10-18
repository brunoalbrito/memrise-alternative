const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

/** "now" when the time has come, otherwise a short relative time such as "in 3 days". */
export function dueText(dueAt: string, now: number): string {
  const ms = new Date(dueAt).getTime() - now;
  if (ms <= 0) return "now";
  const minutes = Math.ceil(ms / 60_000);
  if (minutes < 60) return `in ${plural(minutes, "minute")}`;
  const hours = Math.round(ms / 3_600_000);
  if (hours < 24) return `in ${plural(hours, "hour")}`;
  const days = Math.round(ms / 86_400_000);
  if (days < 60) return `in ${plural(days, "day")}`;
  return `in ${plural(Math.round(days / 30), "month")}`;
}
