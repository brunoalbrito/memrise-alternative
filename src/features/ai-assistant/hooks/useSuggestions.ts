import { useEffect, useRef, useState } from "react";
import { AiError, type AiErrorKind } from "../api/errors";
import { describeScene, generateWordAudio, generateWordText } from "../api/gemini";
import { buildFallbackScene, buildImagePrompt, generateWordImage } from "../api/pollinations";
import type { WordSuggestion } from "../model/suggestion";
import { useAiStore } from "../store/aiStore";

const TIMEOUT_MS = 30000;
const IMAGE_TIMEOUT_MS = 45000;

export type SuggestionState =
  | { status: "loading" }
  | { status: "ready"; suggestion: WordSuggestion; selected: number; audioNote: string | null }
  | { status: "error"; kind: AiErrorKind };

/**
 * Runs the text and audio requests for one word. The first run starts on mount.
 * Closing or unmounting cancels running requests.
 */
export type ImageState =
  | { status: "idle" }
  | { status: "loading"; index: number }
  | { status: "ready"; index: number; blob: Blob }
  | { status: "error"; kind: AiErrorKind };

export function useSuggestions(word: string, languageName: string) {
  const [state, setState] = useState<SuggestionState>({ status: "loading" });
  const [image, setImage] = useState<ImageState>({ status: "idle" });
  const imageControllerRef = useRef<AbortController | null>(null);
  const imageRunRef = useRef(0);
  /** Sentence index a picture is being created for or is ready for. Synchronous, so one click cannot start two requests. */
  const imageIndexRef = useRef<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);

  const stopImage = () => {
    imageRunRef.current += 1;
    imageControllerRef.current?.abort("cancel");
    imageIndexRef.current = null;
  };

  /** Creates a picture for one sentence. A newer request cancels the previous one. */
  const startImage = async (sentence: string, index: number) => {
    stopImage();
    const controller = new AbortController();
    imageControllerRef.current = controller;
    const runId = imageRunRef.current;
    const timer = window.setTimeout(() => controller.abort("timeout"), IMAGE_TIMEOUT_MS);
    const { pollinationsKey, pollinationsModel } = useAiStore.getState();
    if (pollinationsKey === "") {
      window.clearTimeout(timer);
      setImage({ status: "error", kind: "image-no-key" });
      return;
    }
    imageIndexRef.current = index;
    setImage({ status: "loading", index });
    try {
      const { apiKey, textModel, speechModel } = useAiStore.getState();
      let scene: string;
      try {
        scene = await describeScene(
          word.trim(),
          sentence,
          { apiKey, textModel, speechModel },
          controller.signal,
        );
      } catch (error) {
        // A cancellation must stop everything; any other problem uses the fallback scene.
        if (controller.signal.aborted) throw error;
        scene = buildFallbackScene(sentence);
      }
      const blob = await generateWordImage(
        buildImagePrompt(scene),
        pollinationsKey,
        pollinationsModel,
        controller.signal,
      );
      if (runId !== imageRunRef.current) return;
      setImage({ status: "ready", index, blob });
    } catch (error) {
      if (runId !== imageRunRef.current) return;
      imageIndexRef.current = null;
      if (error instanceof AiError) setImage({ status: "error", kind: error.kind });
      else if (controller.signal.reason !== "cancel") {
        setImage({ status: "error", kind: "image" });
      }
    } finally {
      window.clearTimeout(timer);
    }
  };

  const execute = async () => {
    stopImage();
    setImage({ status: "idle" });
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
      imageRunRef.current += 1;
      imageControllerRef.current?.abort("cancel");
    };
    // The first run starts once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = () => {
    setState({ status: "loading" });
    void execute();
  };

  /** The learner chose a sentence: select it and create its picture (once per sentence). */
  const choose = (index: number) => {
    if (state.status !== "ready") return;
    if (index !== state.selected) setState({ ...state, selected: index });
    if (imageIndexRef.current === index) return;
    void startImage(state.suggestion.sentences[index], index);
  };

  /** Another picture for the selected sentence. Ignored while one is being created. */
  const newImage = () => {
    if (state.status !== "ready" || image.status === "loading") return;
    void startImage(state.suggestion.sentences[state.selected], state.selected);
  };

  const cancel = () => {
    runIdRef.current += 1;
    controllerRef.current?.abort("cancel");
    stopImage();
  };

  return { state, image, retry, choose, newImage, cancel };
}
