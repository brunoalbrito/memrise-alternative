import { mediaUrl } from "./mediaStore";

let current: HTMLAudioElement | null = null;

/** Stops whatever recording is playing. */
export function stopAudio(): void {
  current?.pause();
  current = null;
}

/** Plays a stored recording from the start, stopping any other one. `onError` is called when it cannot be played. */
export function playAudio(mediaId: string, onError?: () => void): void {
  stopAudio();
  const audio = new Audio(mediaUrl(mediaId));
  current = audio;
  audio.addEventListener("error", () => onError?.(), { once: true });
  audio.play().catch(() => onError?.());
}
