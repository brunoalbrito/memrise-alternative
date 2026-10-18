import { useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { AddIcon } from "../../../shared/ui/icons";
import { storageWritable } from "../../../shared/storage/storageWritable";
import { putMedia } from "../../../shared/media/mediaStore";
import { AiSettingsButton, type AutoFillResult } from "../../ai-assistant";
import { getCourseLevels, languages, type Course, type MediaRef } from "../../home";
import { useLevels } from "../hooks/useLevels";
import * as ops from "../model/levelOps";
import { validateMediaFile } from "../model/mediaRules";
import { LevelEditor } from "./LevelEditor";

const STORAGE_ERROR = "Could not save your change on this device. Please try again.";
const FILE_ERROR = "Could not save the file on this device. Please try again.";

function slug(word: string): string {
  const cleaned = word
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}_-]/gu, "");
  return cleaned === "" ? "word" : cleaned;
}

export function LevelsTab({ course }: { course: Course }) {
  const { levels, apply } = useLevels(course.id);
  const [showAttributes, setShowAttributes] = useState(false);
  const [focusWordId, setFocusWordId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const languageName =
    languages.find((language) => language.id === course.teachingLanguageId)?.name ?? "";

  /** Fills Meaning, Example and IPA from an AI suggestion and attaches its audio when possible. */
  const applyAutoFill = async (levelId: string, wordId: string, result: AutoFillResult) => {
    if (
      !run((current) =>
        ops.updateWord(current, levelId, wordId, {
          meaning: result.definition,
          example: result.sentence,
          ipa: result.ipa,
        }),
      )
    ) {
      return;
    }
    if (!result.audio) return;

    const level = getCourseLevels(course.id).find((item) => item.id === levelId);
    const word = level?.words.find((item) => item.id === wordId);
    if (!word) return;
    const file = new File([result.audio], `${slug(word.text)}.wav`, { type: "audio/wav" });
    const problem = validateMediaFile(file, "audio", word.audio.length);
    if (problem) {
      setError(
        problem === "A word can have at most 5 audio files."
          ? "This word already has 5 audio files."
          : problem,
      );
      return;
    }
    if (!storageWritable()) {
      setError(FILE_ERROR);
      return;
    }
    const ref: MediaRef = {
      id: `media-${crypto.randomUUID()}`,
      name: file.name,
      type: file.type,
      size: file.size,
    };
    try {
      await putMedia(ref.id, file);
    } catch {
      setError(FILE_ERROR);
      return;
    }
    if (!apply((current) => ops.attachMedia(current, levelId, wordId, "audio", ref))) {
      setError(FILE_ERROR);
    }
  };

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
        <AiSettingsButton />
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
            onAutoFill={(wordId, result) => void applyAutoFill(level.id, wordId, result)}
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
