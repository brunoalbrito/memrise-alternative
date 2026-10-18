import { useEffect, useRef, useState } from "react";
import { AiError, type AiErrorKind } from "../api/errors";
import { generateWordAudio, generateWordText } from "../api/gemini";
import type { WordSuggestion } from "../model/suggestion";
import { useAiStore } from "../store/aiStore";

const TIMEOUT_MS = 30000;

export type SuggestionState =
  | { status: "loading" }
  | { status: "ready"; suggestion: WordSuggestion; selected: number; audioNote: string | null }
  | { status: "error"; kind: AiErrorKind };

/**
 * Runs the text and audio requests for one word. The first run starts on mount.
 * Closing or unmounting cancels running requests.
 */
export function useSuggestions(word: string, languageName: string) {
  const [state, setState] = useState<SuggestionState>({ status: "loading" });
  const controllerRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  const execute = async () => {
    controllerRef.current?.abort("cancel");
    const controller = new AbortController();
    controllerRef.current = controller;
    const runId = (runIdRef.current += 1);
    const timer = window.setTimeout(() => controller.abort("timeout"), TIMEOUT_MS);
    const { apiKey, textModel, speechModel } = useAiStore.getState();
    const settings = { apiKey, textModel, speechModel };
    const trimmed = word.trim();

    const audioPromise = generateWordAudio(trimmed, settings, controller.signal).then(
      (blob) => ({ blob }),
      (error: unknown) => ({ error }),
    );

    try {
      const text = await generateWordText(trimmed, languageName, settings, controller.signal);
      const audio = await audioPromise;
      if (runId !== runIdRef.current || controller.signal.aborted && controller.signal.reason !== "timeout") {
        return;
      }
      const blob = "blob" in audio ? audio.blob : null;
      setState({
        status: "ready",
        suggestion: { word: trimmed, ...text, audio: blob },
        selected: text.best,
        audioNote: blob ? null : "Audio could not be created.",
      });
    } catch (error) {
      if (runId !== runIdRef.current) return;
      if (error instanceof AiError) setState({ status: "error", kind: error.kind });
      else if (controller.signal.reason !== "cancel") setState({ status: "error", kind: "service" });
    } finally {
      window.clearTimeout(timer);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void execute();
    });
    return () => {
      runIdRef.current += 1;
      controllerRef.current?.abort("cancel");
    };
    // The first run starts once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    setState({ status: "loading" });
    void execute();
  };

  const select = (index: number) =>
    setState((current) =>
      current.status === "ready" ? { ...current, selected: index } : current,
    );

  const cancel = () => {
    runIdRef.current += 1;
    controllerRef.current?.abort("cancel");
  };

  return { state, retry, select, cancel };
}
