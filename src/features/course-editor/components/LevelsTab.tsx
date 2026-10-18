import { useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { AddIcon } from "../../../shared/ui/icons";
import { storageWritable } from "../../../shared/storage/storageWritable";
import { languages, type Course } from "../../home";
import { useLevels } from "../hooks/useLevels";
import * as ops from "../model/levelOps";
import { LevelEditor } from "./LevelEditor";

const STORAGE_ERROR = "Could not save your change on this device. Please try again.";

export function LevelsTab({ course }: { course: Course }) {
  const { levels, apply } = useLevels(course.id);
  const [showAttributes, setShowAttributes] = useState(false);
  const [focusWordId, setFocusWordId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const languageName =
    languages.find((language) => language.id === course.teachingLanguageId)?.name ?? "";

  const run = (change: (current: typeof levels) => typeof levels) => {
    if (!storageWritable() || !apply(change)) {
      setError(STORAGE_ERROR);
      return false;
    }
    setError("");
    return true;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="tonal"
          icon={<AddIcon className="size-5" />}
          onClick={() => run((current) => ops.addLevel(current))}
        >
          Add Level
        </Button>
        <label className="inline-flex min-h-10 items-center gap-2 text-label-large font-medium text-on-surface">
          <input
            type="checkbox"
            checked={showAttributes}
            onChange={(event) => setShowAttributes(event.target.checked)}
            className="size-5 accent-primary"
          />
          Show attributes
        </label>
      </div>
      <p aria-live="polite" className="text-body-medium text-error">
        {error}
      </p>
      {levels.length === 0 ? (
        <p className="rounded-m3-lg bg-surface-container px-4 py-8 text-center text-body-large text-on-surface-variant">
          This course has no levels yet. Use Add Level to create one.
        </p>
      ) : (
        levels.map((level, index) => (
          <LevelEditor
            key={level.id}
            courseId={course.id}
            level={level}
            number={index + 1}
            languageName={languageName}
            showAttributes={showAttributes}
            focusWordId={focusWordId}
            onRename={(name) => run((current) => ops.renameLevel(current, level.id, name))}
            onTested={(tested) => run((current) => ops.setTested(current, level.id, tested))}
            onDuplicate={() => run((current) => ops.duplicateLevel(current, level.id))}
            onDelete={() => run((current) => ops.deleteLevel(current, level.id))}
            onAddWord={() => {
              let wordId = "";
              const saved = run((current) => {
                const result = ops.addWord(current, level.id);
                wordId = result.wordId;
                return result.levels;
              });
              if (saved) setFocusWordId(wordId);
            }}
            onUpdateWord={(wordId, patch) =>
              run((current) => ops.updateWord(current, level.id, wordId, patch))
            }
            onDeleteWord={(wordId) =>
              run((current) => ops.deleteWord(current, level.id, wordId))
            }
            onAddMedia={(wordId, kind, ref) =>
              apply((current) => ops.attachMedia(current, level.id, wordId, kind, ref))
            }
            onRemoveMedia={(wordId, kind, mediaId) =>
              run((current) => ops.removeMedia(current, level.id, wordId, kind, mediaId))
            }
          />
        ))
      )}
    </div>
  );
}
