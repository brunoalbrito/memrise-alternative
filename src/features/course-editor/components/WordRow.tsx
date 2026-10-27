import { useEffect, useRef, useState } from "react";
import { IconButton } from "../../../shared/ui/IconButton";
import { AutoFill, type AutoFillResult, useSkipFeedbackStore } from "../../ai-assistant";
import type { FieldName } from "../../ai-assistant/types/skipAI";
import { DeleteIcon } from "../../../shared/ui/icons";
import type { MediaRef, Word } from "../../home";
import type { MediaKind } from "../model/levelOps";
import { MediaCell } from "./MediaCell";
import { SkippedFieldBadge } from "./SkippedFieldBadge";

interface WordRowProps {
  word: Word;
  showAttributes: boolean;
  autoFocus: boolean;
  languageName: string;
  onChange: (patch: Partial<Pick<Word, "text" | "meaning" | "example" | "ipa">>) => void;
  onAutoFill: (result: AutoFillResult) => void;
  onDelete: () => void;
  onAddMedia: (kind: MediaKind, ref: MediaRef) => boolean;
  onRemoveMedia: (kind: MediaKind, mediaId: string) => void;
}

const fieldClasses =
  "w-full rounded-m3-sm border border-transparent bg-transparent px-2 py-1 text-body-medium text-on-surface hover:border-outline-variant focus:border-2 focus:border-primary focus:outline-none";

export function WordRow({
  word,
  showAttributes,
  autoFocus,
  languageName,
  onChange,
  onAutoFill,
  onDelete,
  onAddMedia,
  onRemoveMedia,
}: WordRowProps) {
  const [touched, setTouched] = useState(false);
  const [ipaFocused, setIpaFocused] = useState(false);
  const ipa = word.ipa ?? "";
  const wordRef = useRef<HTMLInputElement>(null);
  const missing = touched && word.text.trim() === "";
  const errorId = `word-error-${word.id}`;

  // Get skipped fields for this word from store
  const skippedFields = useSkipFeedbackStore((state) => state.getSkipped(word.id)) ?? [];
  const isFieldSkipped = (field: FieldName) => skippedFields.includes(field);

  useEffect(() => {
    if (autoFocus) wordRef.current?.focus();
  }, [autoFocus]);

  return (
    <tr className="border-t border-outline-variant align-top">
      <td className="min-w-40 px-2 py-3">
        <input
          ref={wordRef}
          aria-label="Word"
          value={word.text}
          onChange={(event) => onChange({ text: event.target.value })}
          onBlur={() => setTouched(true)}
          aria-invalid={missing ? true : undefined}
          aria-describedby={missing ? errorId : undefined}
          className={fieldClasses}
        />
        {missing && (
          <p id={errorId} className="mt-1 text-label-medium text-error">
            A word is required.
          </p>
        )}
      </td>
      <td className="min-w-44 px-2 py-3">
        <MediaCellSlot kind="images" word={word} onAdd={onAddMedia} onRemove={onRemoveMedia} />
      </td>
      <td className="min-w-52 px-2 py-3">
        <MediaCellSlot kind="audio" word={word} onAdd={onAddMedia} onRemove={onRemoveMedia} />
      </td>
      <td className="min-w-32 px-2 py-3">
        <div className="flex items-center gap-1">
          <input
            aria-label="IPA"
            value={ipaFocused ? ipa : ipa ? `/${ipa}/` : ""}
            onFocus={() => setIpaFocused(true)}
            onBlur={() => setIpaFocused(false)}
            onChange={(event) => {
              onChange({ ipa: event.target.value.trim().replace(/^\/+|\/+$/g, "") });
              useSkipFeedbackStore.getState().clearSkipped(word.id);
            }}
            className={fieldClasses}
          />
          <SkippedFieldBadge isSkipped={isFieldSkipped('ipa')} />
        </div>
      </td>
      <td className="min-w-48 px-2 py-3">
        <div className="flex items-start gap-1">
          <textarea
            aria-label="Meaning"
            rows={2}
            value={word.meaning}
            onChange={(event) => {
              onChange({ meaning: event.target.value });
              useSkipFeedbackStore.getState().clearSkipped(word.id);
            }}
            className={`${fieldClasses} resize-y`}
          />
          <SkippedFieldBadge isSkipped={isFieldSkipped('meaning')} />
        </div>
      </td>
      <td className="min-w-40 px-2 py-3">
        <div className="flex items-start gap-1">
          <textarea
            aria-label="Example"
            rows={2}
            value={word.example}
            onChange={(event) => {
              onChange({ example: event.target.value });
              useSkipFeedbackStore.getState().clearSkipped(word.id);
            }}
            className={`${fieldClasses} resize-y`}
          />
          <SkippedFieldBadge isSkipped={isFieldSkipped('example')} />
        </div>
      </td>
      {showAttributes && (
        <td className="min-w-40 px-2 py-3 text-label-medium text-on-surface-variant">
          <div className="break-all">{word.id}</div>
          <div>images {word.images.length}</div>
          <div>audio {word.audio.length}</div>
        </td>
      )}
      <td className="px-2 py-2">
        <div className="flex">
          <AutoFill word={word.text} languageName={languageName} onApply={onAutoFill} />
          <IconButton aria-label="Delete word" onClick={onDelete}>
            <DeleteIcon />
          </IconButton>
        </div>
      </td>
    </tr>
  );
}


function MediaCellSlot({
  kind,
  word,
  onAdd,
  onRemove,
}: {
  kind: MediaKind;
  word: Word;
  onAdd: (kind: MediaKind, ref: MediaRef) => boolean;
  onRemove: (kind: MediaKind, mediaId: string) => void;
}) {
  return (
    <MediaCell
      kind={kind}
      items={word[kind]}
      onAdd={(ref) => onAdd(kind, ref)}
      onRemove={(mediaId) => onRemove(kind, mediaId)}
    />
  );
}
