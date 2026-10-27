import { useMemo } from 'react';
import type { Word } from '../../home/model/types';
import type { FieldName, FieldState } from '../../ai-assistant/types/skipAI';

/**
 * Detect which metadata fields in a Word are filled vs. empty.
 * Empty = whitespace-only or no content
 * Filled = non-empty text or attached files
 */
export function useWordFieldState(word: Word): {
  filled: FieldState;
  filledFieldNames: FieldName[];
  requestedFieldNames: FieldName[];
} {
  const filled = useMemo(
    (): FieldState => ({
      meaning: word.meaning.trim().length > 0,
      ipa: (word.ipa ?? '').trim().length > 0,
      example: word.example.trim().length > 0,
      images: word.images.length > 0,
      audio: word.audio.length > 0,
    }),
    [word.meaning, word.ipa, word.example, word.images.length, word.audio.length]
  );

  const filledFieldNames = useMemo<FieldName[]>(() => {
    const names: FieldName[] = [];
    if (filled.meaning) names.push('meaning');
    if (filled.ipa) names.push('ipa');
    if (filled.example) names.push('example');
    if (filled.images) names.push('images');
    if (filled.audio) names.push('audio');
    return names;
  }, [filled]);

  const requestedFieldNames = useMemo<FieldName[]>(() => {
    const all: FieldName[] = ['meaning', 'ipa', 'example', 'images', 'audio'];
    return all.filter((name) => !filledFieldNames.includes(name));
  }, [filledFieldNames]);

  return { filled, filledFieldNames, requestedFieldNames };
}
