import { useEffect, useState } from "react";
import { getMedia } from "../../../shared/media/mediaStore";

/** Object URL for a stored file, revoked when no longer needed. */
export function useMediaUrl(id: string): string | null {
  const [state, setState] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
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
  }, [id]);

  return state && state.id === id ? state.url : null;
}
