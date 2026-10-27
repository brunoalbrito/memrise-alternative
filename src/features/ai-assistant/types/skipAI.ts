// Types for skip-AI feature: detect and skip pre-filled fields

export type FieldName = 'meaning' | 'ipa' | 'example' | 'images' | 'audio';

export interface FieldState {
  meaning: boolean;    // true = filled, false = empty
  ipa: boolean;
  example: boolean;
  images: boolean;
  audio: boolean;
}

export interface AIGenerationRequest {
  word: string;
  requestedFields: FieldName[];
  skipFields: FieldName[];
  context?: {
    courseLanguage?: string;
    level?: number;
  };
}

export interface AIGenerationResponse {
  word: string;
  generated: {
    meaning?: string;
    ipa?: string;
    example?: string;
    imageUrls?: string[];
    audioUrl?: string;
  };
  skippedFields: FieldName[];
  tokensCost: number;
}

export interface SkippedFieldFeedback {
  wordId: string;
  skippedFields: FieldName[];
  displayUntil?: number;
}
