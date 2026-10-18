import { useMediaUrl } from "../../../../shared/media/useMediaUrl";
import { BoltIcon, VisibilityIcon, WaterDropIcon } from "../../../../shared/ui/icons";
import type { Word } from "../../../home";
import { dueText } from "../../model/dueText";
import type { WordStatus } from "../../model/wordStatus";

interface LevelWordRowProps {
  word: Word;
  status: WordStatus;
  now: number;
  selecting: boolean;
  selected: boolean;
  onToggle: () => void;
}

function Picture({ mediaId, name }: { mediaId: string; name: string }) {
  const url = useMediaUrl(mediaId);
  return url ? (
    <img src={url} alt="" aria-label={`Picture for ${name}`} loading="lazy" decoding="async" className="h-16 w-24 rounded-m3-sm bg-surface-variant object-cover" />
  ) : (
    <span className="block h-16 w-24 rounded-m3-sm bg-surface-variant" aria-hidden="true" />
  );
}

export function LevelWordRow({ word, status, now, selecting, selected, onToggle }: LevelWordRowProps) {
  const image = word.images[0];
  const hint = word.meaning.trim() !== "" ? word.meaning : word.example;
  const dimmed = status.ignored ? "opacity-60" : "";

  return (
    <li
      className={`flex items-center gap-3 border-t border-outline-variant px-4 py-3 [contain-intrinsic-size:auto_88px] [content-visibility:auto] ${dimmed}`}
    >
      {selecting && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${word.text}`}
          className="size-5 shrink-0 accent-primary"
        />
      )}
      <div className="w-32 shrink-0 sm:w-48">
        <div className="break-words text-title-medium font-medium text-on-surface">{word.text}</div>
        {status.ignored && <div className="text-label-medium text-on-surface-variant">ignored</div>}
      </div>
      <div className="min-w-0 flex-1">
        {image ? <Picture mediaId={image.id} name={word.text} /> : hint !== "" ? <p className="line-clamp-3 text-body-medium text-on-surface-variant">{hint}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 text-label-medium text-on-surface-variant">
        {status.difficult && (
          <span title="Difficult" className="inline-flex">
            <BoltIcon className="size-4" />
            <span className="sr-only">Difficult</span>
          </span>
        )}
        {status.kind === "new" ? (
          <span className="inline-flex items-center gap-1">
            <VisibilityIcon className="size-4" />
            <span className="sr-only sm:not-sr-only">ready to learn</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <WaterDropIcon className="size-4" />
            <span className="sr-only">Ready to review: </span>
            {status.dueAt ? dueText(status.dueAt, now) : ""}
          </span>
        )}
      </div>
    </li>
  );
}
