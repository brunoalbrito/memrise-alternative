import { useEffect, useRef, useState } from "react";
import { deleteMedia, putMedia } from "../../../shared/media/mediaStore";
import { storageWritable } from "../../../shared/storage/storageWritable";
import type { MediaRef } from "../../home";
import { useMediaUrl } from "../../../shared/media/useMediaUrl";
import type { MediaKind } from "../model/levelOps";
import { ACCEPT, validateMediaFile } from "../model/mediaRules";

interface MediaCellProps {
  kind: MediaKind;
  items: MediaRef[];
  onAdd: (ref: MediaRef) => boolean;
  onRemove: (mediaId: string) => void;
}

const STORAGE_ERROR = "Could not save the file on this device. Please try again.";

const smallButton =
  "rounded-m3-sm px-2 py-1 text-label-medium font-medium text-primary hover:bg-primary/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function ImageItem({ item, onRemove }: { item: MediaRef; onRemove: () => void }) {
  const url = useMediaUrl(item.id);
  return (
    <li className="flex items-center gap-3 py-2">
      {url ? (
        <img src={url} alt={item.name} className="size-12 rounded-m3-sm object-cover" />
      ) : (
        <span className="size-12 rounded-m3-sm bg-surface-variant" aria-hidden="true" />
      )}
      <span className="min-w-0 flex-1 break-words text-body-medium">{item.name}</span>
      <button type="button" className={smallButton} onClick={onRemove}>
        Remove
      </button>
    </li>
  );
}

function AudioItem({ item, onRemove }: { item: MediaRef; onRemove: () => void }) {
  const url = useMediaUrl(item.id);
  return (
    <li className="flex flex-col gap-1 py-2">
      <div className="flex items-center gap-3">
        <span className="min-w-0 flex-1 break-words text-body-medium">{item.name}</span>
        <button type="button" className={smallButton} onClick={onRemove}>
          Remove
        </button>
      </div>
      {url ? (
        <audio controls src={url} className="w-full" aria-label={`Play ${item.name}`} />
      ) : (
        <span className="text-label-medium text-on-surface-variant">Loading…</span>
      )}
    </li>
  );
}

export function MediaCell({ kind, items, onAdd, onRemove }: MediaCellProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const countRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const countLabel =
    kind === "images"
      ? `${items.length} ${items.length === 1 ? "image" : "images"}`
      : `${items.length} ${items.length === 1 ? "file" : "files"}`;

  const importFiles = async (files: File[]) => {
    setMessage("");
    let count = items.length;
    for (const file of files) {
      const problem = validateMediaFile(file, kind, count);
      if (problem) {
        setMessage(problem);
        continue;
      }
      if (!storageWritable()) {
        setMessage(STORAGE_ERROR);
        continue;
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
        setMessage(STORAGE_ERROR);
        continue;
      }
      if (onAdd(ref)) {
        count += 1;
      } else {
        deleteMedia(ref.id).catch(() => {});
        setMessage(STORAGE_ERROR);
      }
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="relative flex flex-col gap-1"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.stopPropagation();
          setOpen(false);
          countRef.current?.focus();
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          className={smallButton}
          onClick={() => inputRef.current?.click()}
        >
          Upload
        </button>
        {kind === "audio" && (
          <button
            type="button"
            className={smallButton}
            onClick={() => setMessage("Recording is coming soon.")}
          >
            Record
          </button>
        )}
        <button
          ref={countRef}
          type="button"
          aria-expanded={open}
          aria-label={`${kind === "images" ? "Images" : "Audio"}: ${countLabel}`}
          className="rounded-m3-sm border border-outline-variant px-2 py-1 text-label-medium font-medium text-on-surface hover:bg-on-surface/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onClick={() => setOpen((value) => !value)}
        >
          {countLabel} ▾
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT[kind]}
          className="sr-only"
          tabIndex={-1}
          aria-label={kind === "images" ? "Choose image files" : "Choose audio files"}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length > 0) void importFiles(files);
          }}
        />
      </div>
      <p aria-live="polite" className="text-label-medium text-error">
        {message}
      </p>
      {open && (
        <div className="absolute left-0 top-9 z-20 w-72 max-w-[80vw] rounded-m3-md bg-surface-container-high p-3 shadow-m3-2">
          {items.length === 0 ? (
            <p className="text-body-medium text-on-surface-variant">
              {kind === "images" ? "No images yet." : "No audio files yet."}
            </p>
          ) : (
            <ul className="divide-y divide-outline-variant">
              {items.map((item) =>
                kind === "images" ? (
                  <ImageItem key={item.id} item={item} onRemove={() => onRemove(item.id)} />
                ) : (
                  <AudioItem key={item.id} item={item} onRemove={() => onRemove(item.id)} />
                ),
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
