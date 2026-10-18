import { useState } from "react";
import { Link } from "react-router";
import { Button } from "../../../shared/ui/Button";
import { AddIcon, EditIcon } from "../../../shared/ui/icons";
import type { AutoFillResult } from "../../ai-assistant";
import type { CourseLevel, MediaRef, Word } from "../../home";
import type { MediaKind } from "../model/levelOps";
import { DeleteLevelDialog } from "./DeleteLevelDialog";
import { WordRow } from "./WordRow";

interface LevelEditorProps {
  courseId: string;
  level: CourseLevel;
  number: number;
  languageName: string;
  showAttributes: boolean;
  focusWordId: string | null;
  onRename: (name: string) => void;
  onTested: (tested: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onAddWord: () => void;
  onUpdateWord: (
    wordId: string,
    patch: Partial<Pick<Word, "text" | "meaning" | "example" | "ipa">>,
  ) => void;
  onAutoFill: (wordId: string, result: AutoFillResult) => void;
  onDeleteWord: (wordId: string) => void;
  onAddMedia: (wordId: string, kind: MediaKind, ref: MediaRef) => boolean;
  onRemoveMedia: (wordId: string, kind: MediaKind, mediaId: string) => void;
}

const barButton =
  "rounded-m3-sm px-3 py-1 text-label-large font-medium bg-surface text-on-surface hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-primary";

export function LevelEditor({
  courseId,
  level,
  number,
  languageName,
  showAttributes,
  focusWordId,
  onRename,
  onTested,
  onDuplicate,
  onDelete,
  onAddWord,
  onUpdateWord,
  onAutoFill,
  onDeleteWord,
  onAddMedia,
  onRemoveMedia,
}: LevelEditorProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [name, setName] = useState(level.name);
  const bodyId = `level-body-${level.id}`;

  return (
    <section
      aria-label={`Level ${number}`}
      className="overflow-hidden rounded-m3-lg border border-outline-variant bg-surface-container"
    >
      <div className="flex flex-wrap items-center gap-3 bg-primary px-4 py-3 text-on-primary">
        <span className="text-title-large font-medium">{number}</span>
        <input
          aria-label="Level name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            onRename(event.target.value);
          }}
          onBlur={() => {
            if (name.trim() === "") setName(`Level ${number}`);
          }}
          className="min-w-32 flex-1 rounded-m3-sm border border-transparent bg-transparent px-2 py-1 text-title-large text-on-primary hover:border-on-primary/50 focus:border-2 focus:border-on-primary focus:outline-none"
        />
        <span className="text-body-large">({languageName})</span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-expanded={!collapsed}
            aria-controls={bodyId}
            className={barButton}
            onClick={() => setCollapsed((value) => !value)}
          >
            Show/Hide
          </button>
          <Link to={`/course/${courseId}/levels/${number}`} className={barButton}>
            Preview
          </Link>
          <button type="button" className={barButton} onClick={onDuplicate}>
            Duplicate
          </button>
          <button type="button" className={barButton} onClick={() => setConfirming(true)}>
            Delete
          </button>
        </div>
      </div>
      <div id={bodyId} hidden={collapsed}>
        <div className="flex items-center gap-2 px-4 py-3">
          <input
            aria-label="How this level is tested"
            value={level.tested}
            onChange={(event) => onTested(event.target.value)}
            className="min-w-0 flex-1 rounded-m3-sm border border-transparent bg-transparent px-2 py-1 text-body-large font-medium text-on-surface hover:border-outline-variant focus:border-2 focus:border-primary focus:outline-none"
          />
          <EditIcon className="size-5 text-on-surface-variant" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left">
            <thead>
              <tr className="text-label-large font-medium text-on-surface-variant">
                <th scope="col" className="px-2 py-2">Word</th>
                <th scope="col" className="px-2 py-2">Images</th>
                <th scope="col" className="px-2 py-2">Audio</th>
                <th scope="col" className="px-2 py-2">IPA</th>
                <th scope="col" className="px-2 py-2">Meaning</th>
                <th scope="col" className="px-2 py-2">Example</th>
                {showAttributes && (
                  <th scope="col" className="px-2 py-2">Attributes</th>
                )}
                <th scope="col" className="px-2 py-2">
                  <span className="sr-only">Delete</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {level.words.map((word) => (
                <WordRow
                  key={word.id}
                  word={word}
                  showAttributes={showAttributes}
                  autoFocus={focusWordId === word.id}
                  languageName={languageName}
                  onChange={(patch) => onUpdateWord(word.id, patch)}
                  onAutoFill={(result) => onAutoFill(word.id, result)}
                  onDelete={() => onDeleteWord(word.id)}
                  onAddMedia={(kind, ref) => onAddMedia(word.id, kind, ref)}
                  onRemoveMedia={(kind, mediaId) =>
                    onRemoveMedia(word.id, kind, mediaId)
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3">
          <Button variant="text" icon={<AddIcon className="size-5" />} onClick={onAddWord}>
            Add word
          </Button>
        </div>
      </div>
      {confirming && (
        <DeleteLevelDialog
          levelNumber={number}
          onConfirm={onDelete}
          onClose={() => setConfirming(false)}
        />
      )}
    </section>
  );
}
