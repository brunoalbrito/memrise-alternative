import type { Word } from '../../home/model/types';
import type { FieldName } from '../types/skipAI';

/**
 * Detect which fields in a Word are filled (non-empty).
 * Returns array of field names that contain content.
 *
 * Empty = whitespace-only, null, undefined, empty arrays
 * Filled = non-empty text or array with items
 */
export function detectFilledFields(word: Word): FieldName[] {
  const filled: FieldName[] = [];

  if (word.meaning.trim().length > 0) {
    filled.push('meaning');
  }

  if ((word.ipa ?? '').trim().length > 0) {
    filled.push('ipa');
  }

  if (word.example.trim().length > 0) {
    filled.push('example');
  }

  if (word.images.length > 0) {
    filled.push('images');
  }

  if (word.audio.length > 0) {
    filled.push('audio');
  }

  return filled;
}

/**
 * Get fields that need AI generation (not already filled).
 * Returns array of field names that should be requested from AI.
 */
export function getRequestedFields(word: Word): FieldName[] {
  const allFields: FieldName[] = ['meaning', 'ipa', 'example', 'images', 'audio'];
  const filled = detectFilledFields(word);
  return allFields.filter((name) => !filled.includes(name));
}

/**
 * Check if all fields are already filled.
 * Returns true if user has provided content for all metadata fields.
 */
export function allFieldsFilled(word: Word): boolean {
  return detectFilledFields(word).length === 5;
}

/**
 * Check if any fields are filled.
 * Useful to determine if AI skip logic applies.
 */
export function anyFieldsFilled(word: Word): boolean {
  return detectFilledFields(word).length > 0;
}
