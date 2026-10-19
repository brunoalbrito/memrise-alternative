import { addedSince, snapshot } from "./guard";

/** Fails the run if any test created data in the folders of the installed or development app. */
export default function globalSetup(): () => void {
  const before = snapshot();
  return () => {
    const added = addedSince(before, snapshot());
    if (added.length > 0) {
      throw new Error(`End-to-end tests left data in the real app folders (if you used MemBetter during the run, that may be the cause):\n${added.map((a) => `  ${a}`).join("\n")}`);
    }
  };
}
