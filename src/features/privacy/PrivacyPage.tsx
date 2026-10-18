import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getApi, isDesktop } from "../../shared/api";
import { Button } from "../../shared/ui/Button";
import { TopAppBar } from "../home";

const section = "mt-6";
const h2 = "text-title-large text-on-surface";
const p = "mt-2 text-body-large text-on-surface-variant";

/** What MemBetter stores on this computer and what leaves it. */
export function PrivacyPage() {
  const [info, setInfo] = useState<{ version: string; dataPath: string } | null>(null);

  useEffect(() => {
    if (!isDesktop()) return;
    void getApi()
      .app.info()
      .then((result) => {
        if (result.ok) setInfo({ version: result.data.version, dataPath: result.data.dataPath });
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-8">
        <h1 className="text-headline-medium text-on-surface">Privacy</h1>
        <p className={p}>MemBetter keeps your learning on your computer. There is no account and nothing is uploaded unless you choose to use an AI feature.</p>

        <section className={section} aria-labelledby="stored">
          <h2 id="stored" className={h2}>
            What is stored on this computer
          </h2>
          <ul className="mt-2 list-disc pl-6 text-body-large text-on-surface-variant">
            <li>Your courses, levels, words, pictures and audio.</li>
            <li>Your study progress: which words you learned, when they are due, and every answer you gave.</li>
            <li>Your settings, such as daily goals and backup options.</li>
            <li>Backups you make or schedule, in the folder you choose.</li>
          </ul>
          {info && (
            <p className={p}>
              Your library is in <code className="break-all rounded-m3-sm bg-surface-container px-1">{info.dataPath}</code>. Deleting that folder (and your backup folder)
              removes everything.
            </p>
          )}
          {info && (
            <div className="mt-3">
              <Button variant="tonal" onClick={() => void getApi().app.openDataFolder()}>
                Show the folder
              </Button>
            </div>
          )}
        </section>

        <section className={section} aria-labelledby="ai">
          <h2 id="ai" className={h2}>
            What AI features send
          </h2>
          <p className={p}>AI is optional and uses your own keys. When you use Auto-fill:</p>
          <ul className="mt-2 list-disc pl-6 text-body-large text-on-surface-variant">
            <li>
              <strong>Google AI Studio</strong> receives the word and the course language to write a definition, example sentences, IPA and audio.
            </li>
            <li>
              <strong>Pollinations</strong> receives a description of a scene made from the word and the sentence you choose, to draw a picture.
            </li>
          </ul>
          <p className={p}>
            Your keys are encrypted with your operating system's protected storage (Keychain, Windows data protection or your Linux keyring) and are only used by the app to make
            these requests. They are never shown again and are never included in exports or backups. Those services have their own privacy terms.
          </p>
        </section>

        <section className={section} aria-labelledby="share">
          <h2 id="share" className={h2}>
            Sharing and exports
          </h2>
          <p className={p}>
            A course file contains the course content you export. Your study progress is only included if you tick that box. Files you export or back up are not encrypted, so
            keep them somewhere you trust.
          </p>
        </section>

        <section className={section} aria-labelledby="updates">
          <h2 id="updates" className={h2}>
            Updates
          </h2>
          <p className={p}>
            The installed app checks GitHub for a newer version from time to time. That request tells GitHub your IP address and the app version. Updates never change your
            library without keeping a copy of it first.
          </p>
        </section>

        <section className={section} aria-labelledby="none">
          <h2 id="none" className={h2}>
            What MemBetter does not do
          </h2>
          <p className={p}>No accounts, no analytics, no advertising and no tracking.</p>
          {info && <p className={p}>Version {info.version}.</p>}
        </section>

        <Link to="/" className="mt-8 inline-block text-label-large font-medium text-primary underline">
          Back to Home
        </Link>
      </main>
    </div>
  );
}
