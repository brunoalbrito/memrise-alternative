import { pathToFileURL } from "node:url";
import { net, protocol } from "electron";
import type { MediaStore } from "../services/media";

export const MEDIA_SCHEME = "membetter-media";

/** Must run before the app is ready. */
export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: MEDIA_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
  ]);
}

/** Serves `membetter-media://media/<id>` from the library's media folder. Only ids known to the database resolve. */
export function handleMediaProtocol(store: MediaStore): void {
  protocol.handle(MEDIA_SCHEME, async (request) => {
    const id = decodeURIComponent(new URL(request.url).pathname.replace(/^\//, ""));
    const file = store.resolve(id);
    if (!file) return new Response("Not found", { status: 404 });
    const response = await net.fetch(pathToFileURL(file.path).toString(), { headers: request.headers });
    const headers = new Headers(response.headers);
    headers.set("Content-Type", file.contentType);
    headers.set("X-Content-Type-Options", "nosniff");
    headers.set("Cache-Control", "private, max-age=31536000, immutable");
    return new Response(response.body, { status: response.status, headers });
  });
}
