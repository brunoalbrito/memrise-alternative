export { AiSettingsButton } from "./components/AiSettingsButton";
export { AutoFill } from "./components/AutoFill";
export type { AutoFillResult } from "./components/SuggestionDialog";
export { useAiStore } from "./store/aiStore";
export { useSkipFeedbackStore } from "./store/skipFeedbackStore";
export { detectFilledFields, getRequestedFields, allFieldsFilled, anyFieldsFilled } from "./utils/fieldDetection";
export type { FieldState, FieldName, AIGenerationRequest, AIGenerationResponse, SkippedFieldFeedback } from "./types/skipAI";
