import type { ReactNode } from "react";
import { useMediaUrl } from "../../../shared/media/useMediaUrl";
import type { Word } from "../../home";
import type { ChoiceOption, Exercise } from "../model/exercises";
import { AudioButton } from "./AudioButton";

interface ChoiceExerciseProps {
  exercise: Exercise;
  word: Word;
  /** Option numbers that were chosen and were wrong. */
  wrong: number[];
  /** The right option is shown (answered or given up). */
  showAnswer: boolean;
  disabled: boolean;
  showShortcuts: boolean;
  feedback: ReactNode;
  lang?: string;
  onPick: (index: number) => void;
  onAudioError: () => void;
}

const base =
  "relative flex min-h-16 items-center justify-center rounded-m3-md border-2 p-3 text-center text-title-medium text-on-surface transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function OptionPicture({ id, label }: { id: string; label: string }) {
  const url = useMediaUrl(id);
  return url ? <img src={url} alt="" aria-label={label} className="h-32 w-full rounded-m3-sm object-cover sm:h-40" /> : <span className="block h-32 w-full rounded-m3-sm bg-surface-variant sm:h-40" aria-hidden="true" />;
}

function Prompt({ exercise, word, lang, onAudioError }: Pick<ChoiceExerciseProps, "exercise" | "word" | "lang" | "onAudioError">) {
  const audio = word.audio[0];
  switch (exercise.kind) {
    case "word-to-image":
    case "word-to-meaning":
    case "word-to-audio":
      return (
        <p lang={lang} className="text-center text-display-small text-on-surface">
          {word.text}
        </p>
      );
    case "image-to-word": {
      return <PromptPicture word={word} />;
    }
    case "meaning-to-word":
      return <p className="rounded-m3-md bg-surface-container-high p-5 text-center text-title-large text-on-surface">{word.meaning}</p>;
    case "audio-to-word":
      return (
        <div className="flex justify-center">{audio && <AudioButton big mediaId={audio.id} label="Play the recording" shortcut="R" onError={onAudioError} />}</div>
      );
    default:
      return null;
  }
}

function PromptPicture({ word }: { word: Word }) {
  const url = useMediaUrl(word.images[0]?.id ?? "");
  return url ? (
    <img src={url} alt="" aria-label="Picture clue" className="mx-auto h-48 w-72 max-w-full rounded-m3-md bg-surface-variant object-cover" />
  ) : (
    <div className="mx-auto h-48 w-72 max-w-full rounded-m3-md bg-surface-variant" role="img" aria-label="Picture clue loading" />
  );
}

export function ChoiceExercise({ exercise, word, wrong, showAnswer, disabled, showShortcuts, feedback, lang, onPick, onAudioError }: ChoiceExerciseProps) {
  const imageOptions = exercise.options.every((o) => o.imageId);
  const question = {
    "word-to-image": "Which picture shows this word?",
    "image-to-word": "Which word is this?",
    "word-to-meaning": "What does this word mean?",
    "meaning-to-word": "Which word has this meaning?",
    "audio-to-word": "Which word do you hear?",
    "word-to-audio": "Which recording says this word?",
    type: "",
    "audio-to-type": "",
  }[exercise.kind];

  const tone = (i: number): string => {
    if (showAnswer && i === exercise.correct) return "border-primary bg-primary-container";
    if (wrong.includes(i)) return "border-error bg-error-container opacity-70";
    return "border-outline-variant bg-surface-container-highest hover:bg-on-surface/8";
  };
  const shortcut = (i: number) => (showShortcuts ? <span aria-hidden="true" className="absolute bottom-1 right-2 text-label-medium text-on-surface-variant">{i + 1}</span> : null);

  const renderOption = (option: ChoiceOption, i: number) => {
    const inactive = disabled || wrong.includes(i);
    if (option.audioId) {
      return (
        <div key={i} className={`${base} gap-3 ${tone(i)}`}>
          <AudioButton mediaId={option.audioId} label={`Play recording ${i + 1}`} onError={onAudioError} />
          <button
            type="button"
            disabled={inactive}
            onClick={() => onPick(i)}
            aria-label={`Choose recording ${i + 1}`}
            className="rounded-full bg-primary px-5 py-2 text-label-large font-medium text-on-primary disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Choose {i + 1}
          </button>
        </div>
      );
    }
    return (
      <button
        key={i}
        type="button"
        disabled={inactive}
        onClick={() => onPick(i)}
        aria-label={option.imageId ? `Picture ${i + 1}` : undefined}
        className={`${base} ${tone(i)} disabled:cursor-default`}
      >
        {option.imageId ? <OptionPicture id={option.imageId} label={`Picture option ${i + 1}`} /> : <span lang={exercise.kind === "word-to-meaning" ? undefined : lang}>{option.text}</span>}
        {shortcut(i)}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4 md:col-span-2">
      <h2 className="text-center text-label-large font-medium text-on-surface-variant">{question}</h2>
      <Prompt exercise={exercise} word={word} lang={lang} onAudioError={onAudioError} />
      <div id="practice-feedback" role="status" aria-live="polite" className="min-h-10">
        {feedback}
      </div>
      <div role="group" aria-label="Answers" className={`mx-auto grid w-full max-w-3xl gap-3 ${imageOptions ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"}`}>
        {exercise.options.map(renderOption)}
      </div>
    </div>
  );
}
