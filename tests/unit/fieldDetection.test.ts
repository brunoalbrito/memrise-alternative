import { describe, it, expect } from 'vitest';
import type { Word } from '../../src/features/home/model/types';
import { detectFilledFields, getRequestedFields, allFieldsFilled, anyFieldsFilled } from '../../src/features/ai-assistant/utils/fieldDetection';

const emptyWord: Word = {
  id: 'test-1',
  text: 'owl',
  meaning: '',
  example: '',
  ipa: undefined,
  images: [],
  audio: [],
  learned: false,
};

const partiallyFilledWord: Word = {
  id: 'test-2',
  text: 'owl',
  meaning: 'A nocturnal bird',
  example: '',
  ipa: 'aʊl',
  images: [],
  audio: [],
  learned: false,
};

const fullyFilledWord: Word = {
  id: 'test-3',
  text: 'owl',
  meaning: 'A nocturnal bird',
  example: 'The owl hooted at night',
  ipa: 'aʊl',
  images: [{ id: 'img-1', name: 'owl.jpg', type: 'image/jpeg', size: 1024 }],
  audio: [{ id: 'audio-1', name: 'owl.wav', type: 'audio/wav', size: 2048 }],
  learned: false,
};

describe('detectFilledFields', () => {
  it('returns empty array when no fields are filled', () => {
    const result = detectFilledFields(emptyWord);
    expect(result).toEqual([]);
  });

  it('detects filled text fields', () => {
    const result = detectFilledFields(partiallyFilledWord);
    expect(result).toContain('meaning');
    expect(result).toContain('ipa');
    expect(result).not.toContain('example');
  });

  it('detects filled attachment fields', () => {
    const result = detectFilledFields(fullyFilledWord);
    expect(result).toContain('images');
    expect(result).toContain('audio');
  });

  it('treats whitespace-only as empty', () => {
    const wordWithWhitespace: Word = {
      ...emptyWord,
      meaning: '   ',
      example: '\n\t',
      ipa: '  ',
    };
    const result = detectFilledFields(wordWithWhitespace);
    expect(result.length).toBe(0);
  });

  it('returns all fields when word is fully filled', () => {
    const result = detectFilledFields(fullyFilledWord);
    expect(result.length).toBe(5);
    expect(result).toEqual(['meaning', 'ipa', 'example', 'images', 'audio']);
  });
});

describe('getRequestedFields', () => {
  it('returns all fields when word is empty', () => {
    const result = getRequestedFields(emptyWord);
    expect(result).toEqual(['meaning', 'ipa', 'example', 'images', 'audio']);
  });

  it('returns only unfilled fields', () => {
    const result = getRequestedFields(partiallyFilledWord);
    expect(result).toEqual(['example', 'images', 'audio']);
  });

  it('returns empty array when all fields are filled', () => {
    const result = getRequestedFields(fullyFilledWord);
    expect(result.length).toBe(0);
  });
});

describe('allFieldsFilled', () => {
  it('returns false for empty word', () => {
    expect(allFieldsFilled(emptyWord)).toBe(false);
  });

  it('returns false for partially filled word', () => {
    expect(allFieldsFilled(partiallyFilledWord)).toBe(false);
  });

  it('returns true for fully filled word', () => {
    expect(allFieldsFilled(fullyFilledWord)).toBe(true);
  });
});

describe('anyFieldsFilled', () => {
  it('returns false for empty word', () => {
    expect(anyFieldsFilled(emptyWord)).toBe(false);
  });

  it('returns true for partially filled word', () => {
    expect(anyFieldsFilled(partiallyFilledWord)).toBe(true);
  });

  it('returns true for fully filled word', () => {
    expect(anyFieldsFilled(fullyFilledWord)).toBe(true);
  });
});
