import { useEffect, useState } from "react";
import { isDesktop } from "../api";
import { getMedia, mediaUrl } from "./mediaStore";

/** URL for a stored file: served by the app in the desktop build, an object URL (revoked when unused) in the browser. */
export function useMediaUrl(id: string): string | null {
  const desktop = isDesktop();
  const [state, setState] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    if (desktop) return;
    let cancelled = false;
    let created: string | null = null;
    getMedia(id)
      .then((blob) => {
        if (cancelled || !blob) return;
        created = URL.createObjectURL(blob);
        setState({ id, url: created });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (created) URL.revokeObjectURL(created);
    };
  }, [id, desktop]);

  if (desktop) return mediaUrl(id);
  return state && state.id === id ? state.url : null;
}
