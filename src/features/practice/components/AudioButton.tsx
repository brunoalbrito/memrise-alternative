import { playAudio } from "../../../shared/media/playAudio";
import { SoundIcon } from "../../../shared/ui/icons";

interface AudioButtonProps {
  mediaId: string;
  label: string;
  big?: boolean;
  shortcut?: string | null;
  onError?: () => void;
}

/** Plays a stored recording. */
export function AudioButton({ mediaId, label, big = false, shortcut, onError }: AudioButtonProps) {
  return (
    <button
      type="button"
      onClick={() => playAudio(mediaId, onError)}
      aria-label={label}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-secondary-container text-on-secondary-container hover:shadow-m3-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
        big ? "size-24" : "size-12"
      }`}
    >
      <SoundIcon className={big ? "size-12" : "size-6"} />
      {shortcut && (
        <span aria-hidden="true" className="text-label-medium opacity-70">
          {shortcut}
        </span>
      )}
    </button>
  );
}
