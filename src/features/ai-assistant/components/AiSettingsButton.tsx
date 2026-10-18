import { useState } from "react";
import { Button } from "../../../shared/ui/Button";
import { SparkleIcon } from "../../../shared/ui/icons";
import { useAiStore } from "../store/aiStore";
import { ConnectDialog } from "./ConnectDialog";

export function AiSettingsButton() {
  const connected = useAiStore((state) => state.apiKey !== "");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="text"
        icon={<SparkleIcon className="size-5" />}
        onClick={() => setOpen(true)}
      >
        {connected ? "AI settings" : "Connect AI"}
      </Button>
      {open && <ConnectDialog onClose={() => setOpen(false)} />}
    </>
  );
}
