import { useMediaUrl } from "../../../shared/media/useMediaUrl";
import type { Word } from "../../home";
import { AudioButton } from "./AudioButton";

interface WordClueProps {
  word: Word;
  /** Listening: the recording replaces the picture and the word's own text is not shown. */
  listening?: boolean;
  onAudioError?: () => void;
}

/** The picture for the word. Without one, the meaning or example is shown so the word can still be practiced. */
export function WordClue({ word, listening = false, onAudioError }: WordClueProps) {
  const image = word.images[0];
  const url = useMediaUrl(image?.id ?? "");
  const audio = word.audio[0];
  if ((listening || (!image && word.meaning.trim() === "" && word.example.trim() === "")) && audio) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-m3-md bg-surface-container-high p-5">
        <AudioButton big mediaId={audio.id} label="Play the recording" shortcut="Alt+R" onError={onAudioError} />
        <p className="text-label-large text-on-surface-variant">Listen and type the word</p>
      </div>
    );
  }
  if (image) {
    return url ? (
      <img src={url} alt="" aria-label="Picture clue" className="aspect-[4/3] w-full rounded-m3-md bg-surface-variant object-cover" />
    ) : (
      <div className="aspect-[4/3] w-full rounded-m3-md bg-surface-variant" role="img" aria-label="Picture clue loading" />
    );
  }
  const text = word.meaning.trim() !== "" ? word.meaning : word.example;
  return (
    <div className="flex aspect-[4/3] w-full items-center rounded-m3-md bg-surface-container-high p-5 text-title-large text-on-surface">
      <p lang="und">{text}</p>
    </div>
  );
}
