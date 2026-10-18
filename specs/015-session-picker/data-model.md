# Data Model: Session Picker

No persisted data. Derived values (pure, in `home/model/selectors.ts`):
- `recommendedSession(course): "classic-review" | "learn-new-words"`: classic review when `itemsDue > 0`.
- `dueBadge(due: number): string | null`: `null` for 0, the number as text for 1 to 98, `"99+"` for 99 or more.
