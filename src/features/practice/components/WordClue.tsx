import { useMediaUrl } from "../../../shared/media/useMediaUrl";
import type { Word } from "../../home";

/** The picture for the word. Without one, the meaning or example is shown so the word can still be practiced. */
export function WordClue({ word }: { word: Word }) {
  const image = word.images[0];
  const url = useMediaUrl(image?.id ?? "");
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
