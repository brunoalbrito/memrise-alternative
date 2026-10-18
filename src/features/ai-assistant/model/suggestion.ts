export interface WordText {
  definition: string;
  sentences: string[];
  best: number;
  ipa: string;
}

export interface WordSuggestion extends WordText {
  word: string;
  audio: Blob | null;
}
