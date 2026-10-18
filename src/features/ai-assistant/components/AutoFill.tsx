import { useState } from "react";
import { IconButton } from "../../../shared/ui/IconButton";
import { SparkleIcon } from "../../../shared/ui/icons";
import { useAiStore } from "../store/aiStore";
import { ConnectDialog } from "./ConnectDialog";
import { SuggestionDialog, type AutoFillResult } from "./SuggestionDialog";

export const MAX_WORD_LENGTH = 60;

interface AutoFillProps {
  word: string;
  languageName: string;
  onApply: (result: AutoFillResult) => void;
}

export function AutoFill({ word, languageName, onApply }: AutoFillProps) {
  const [dialog, setDialog] = useState<"none" | "connect" | "suggest">("none");
  const trimmed = word.trim();
  const tooLong = trimmed.length > MAX_WORD_LENGTH;
  const disabled = trimmed === "" || tooLong;

  const open = () => {
    setDialog(useAiStore.getState().apiKey === "" ? "connect" : "suggest");
  };

  return (
    <>
      <IconButton
        aria-label="Auto-fill word"
        title={tooLong ? "Use a shorter word or phrase (up to 60 characters)." : "Auto-fill word"}
        disabled={disabled}
        className="disabled:opacity-40"
        onClick={open}
      >
        <SparkleIcon />
      </IconButton>
      {dialog === "connect" && (
        <ConnectDialog onClose={() => setDialog("none")} onSaved={() => setDialog("suggest")} />
      )}
      {dialog === "suggest" && (
        <SuggestionDialog
          word={word}
          languageName={languageName}
          onApply={onApply}
          onClose={() => setDialog("none")}
          onOpenSettings={() => setDialog("connect")}
        />
      )}
    </>
  );
}

export type { AutoFillResult };
