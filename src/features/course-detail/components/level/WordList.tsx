import { useState } from "react";
import { Button } from "../../../../shared/ui/Button";
import { RemoveCircleIcon } from "../../../../shared/ui/icons";
import type { StatusRow } from "../../model/levelStats";
import { LevelWordRow } from "./LevelWordRow";
import { StatusLegend } from "./StatusLegend";

interface WordListProps {
  rows: StatusRow[];
  now: number;
  onIgnore: (wordIds: string[], ignored: boolean) => void;
}

export function WordList({ rows, now, onIgnore }: WordListProps) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const ids = rows.map((row) => row.word.id);
  const chosen = rows.filter((row) => selected.has(row.word.id));
  const allIgnored = chosen.length > 0 && chosen.every((row) => row.status.ignored);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const stop = () => {
    setSelecting(false);
    setSelected(new Set());
  };

  return (
    <section aria-label="Words" className="overflow-hidden rounded-m3-lg bg-surface-container-high">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          aria-pressed={selecting}
          onClick={() => (selecting ? stop() : setSelecting(true))}
          className="rounded-m3-sm px-2 py-1 text-label-large font-medium text-primary hover:bg-primary/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {selecting ? "Done" : "Actions"}
        </button>
        <StatusLegend />
        <Button
          variant="tonal"
          icon={<RemoveCircleIcon className="size-5" />}
          disabled={chosen.length === 0}
          onClick={() => {
            onIgnore(
              chosen.map((row) => row.word.id),
              !allIgnored,
            );
            setSelected(new Set());
          }}
        >
          {allIgnored ? "Restore" : "Ignore"}
        </Button>
      </div>
      {selecting && (
        <label className="flex items-center gap-3 border-t border-outline-variant px-4 py-2 text-body-medium">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(ids))}
            className="size-5 accent-primary"
          />
          Select all ({selected.size} selected)
        </label>
      )}
      {rows.length === 0 ? (
        <p className="border-t border-outline-variant px-4 py-6 text-body-large text-on-surface-variant">This level has no words yet.</p>
      ) : (
        <ul aria-label="Word list">
          {rows.map(({ word, status }) => (
            <LevelWordRow
              key={word.id}
              word={word}
              status={status}
              now={now}
              selecting={selecting}
              selected={selected.has(word.id)}
              onToggle={() => toggle(word.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
