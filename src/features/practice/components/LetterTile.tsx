interface LetterTileProps {
  letter: string;
  shortcut: string | null;
  showShortcut: boolean;
  used: boolean;
  disabled: boolean;
  onPick: () => void;
}

export function LetterTile({ letter, shortcut, showShortcut, used, disabled, onPick }: LetterTileProps) {
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled || used}
      aria-label={shortcut ? `${letter}, key ${shortcut}` : letter}
      className={`relative flex size-12 items-center justify-center rounded-m3-md border-b-4 border-outline-variant bg-surface-container-highest text-headline-medium text-on-surface transition-opacity hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px active:border-b-2 disabled:cursor-default ${
        used ? "opacity-30" : ""
      }`}
    >
      {letter}
      {showShortcut && shortcut && (
        <span aria-hidden="true" className="absolute bottom-0.5 right-1.5 text-label-medium text-on-surface-variant">
          {shortcut}
        </span>
      )}
    </button>
  );
}
