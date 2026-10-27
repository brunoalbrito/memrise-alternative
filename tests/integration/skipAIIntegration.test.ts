import { describe, it, expect, beforeEach } from 'vitest';
import type { Word } from '../../src/features/home/model/types';
import { detectFilledFields, getRequestedFields, allFieldsFilled, anyFieldsFilled } from '../../src/features/ai-assistant/utils/fieldDetection';
import { useSkipFeedbackStore } from '../../src/features/ai-assistant/store/skipFeedbackStore';

describe('Skip-AI Feature Integration', () => {
  beforeEach(() => {
    // Clear store state before each test
    useSkipFeedbackStore.getState().skippedFields.clear();
  });

  describe('Scenario 1: User fills Meaning, triggers AI', () => {
    it('should detect Meaning as filled', () => {
      const word: Word = {
        id: 'test-1',
        text: 'owl',
        meaning: 'A nocturnal bird',
        example: '',
        ipa: undefined,
        images: [],
        audio: [],
        learned: false,
      };

      const filled = detectFilledFields(word);
      expect(filled).toContain('meaning');
      expect(filled).not.toContain('example');
      expect(filled).not.toContain('ipa');
    });

    it('should request only empty fields', () => {
      const word: Word = {
        id: 'test-1',
        text: 'owl',
        meaning: 'A nocturnal bird',
        example: '',
        ipa: undefined,
        images: [],
        audio: [],
        learned: false,
      };

      const requested = getRequestedFields(word);
      expect(requested).toEqual(['ipa', 'example', 'images', 'audio']);
      expect(requested).not.toContain('meaning');
    });

    it('should track skipped fields in store', () => {
      const wordId = 'test-1';
      const skippedFields = ['meaning'];

      useSkipFeedbackStore.getState().setSkippedFields(wordId, skippedFields as any);

      const retrieved = useSkipFeedbackStore.getState().getSkipped(wordId);
      expect(retrieved).toEqual(['meaning']);
    });
  });

  describe('Scenario 2: User fills multiple fields', () => {
    it('should detect multiple pre-filled fields', () => {
      const word: Word = {
        id: 'test-2',
        text: 'owl',
        meaning: 'A nocturnal bird',
        example: 'The owl hooted at night',
        ipa: 'aʊl',
        images: [],
        audio: [],
        learned: false,
      };

      const filled = detectFilledFields(word);
      expect(filled).toContain('meaning');
      expect(filled).toContain('ipa');
      expect(filled).toContain('example');
      expect(filled).not.toContain('images');
      expect(filled).not.toContain('audio');
    });

    it('should request only images and audio', () => {
      const word: Word = {
        id: 'test-2',
        text: 'owl',
        meaning: 'A nocturnal bird',
        example: 'The owl hooted at night',
        ipa: 'aʊl',
        images: [],
        audio: [],
        learned: false,
      };

      const requested = getRequestedFields(word);
      expect(requested).toEqual(['images', 'audio']);
    });
  });

  describe('Scenario 3: All fields pre-filled', () => {
    it('should detect all fields as filled', () => {
      const word: Word = {
        id: 'test-3',
        text: 'owl',
        meaning: 'A nocturnal bird',
        example: 'The owl hooted at night',
        ipa: 'aʊl',
        images: [{ id: 'img-1', name: 'owl.jpg', type: 'image/jpeg', size: 1024 }],
        audio: [{ id: 'audio-1', name: 'owl.wav', type: 'audio/wav', size: 2048 }],
        learned: false,
      };

      expect(allFieldsFilled(word)).toBe(true);
      expect(getRequestedFields(word).length).toBe(0);
    });

    it('should not request any fields', () => {
      const word: Word = {
        id: 'test-3',
        text: 'owl',
        meaning: 'A nocturnal bird',
        example: 'The owl hooted at night',
        ipa: 'aʊl',
        images: [{ id: 'img-1', name: 'owl.jpg', type: 'image/jpeg', size: 1024 }],
        audio: [{ id: 'audio-1', name: 'owl.wav', type: 'audio/wav', size: 2048 }],
        learned: false,
      };

      const requested = getRequestedFields(word);
      expect(requested.length).toBe(0);
    });
  });

  describe('Scenario 4: Skip feedback tracking', () => {
    it('should track skipped fields across multiple words', () => {
      const word1Id = 'word-1';
      const word2Id = 'word-2';

      useSkipFeedbackStore.getState().setSkippedFields(word1Id, ['meaning' as any]);
      useSkipFeedbackStore.getState().setSkippedFields(word2Id, ['ipa' as any, 'audio' as any]);

      expect(useSkipFeedbackStore.getState().getSkipped(word1Id)).toEqual(['meaning']);
      expect(useSkipFeedbackStore.getState().getSkipped(word2Id)).toEqual(['ipa', 'audio']);
    });

    it('should clear skipped fields when user edits', () => {
      const wordId = 'test-word';
      useSkipFeedbackStore.getState().setSkippedFields(wordId, ['meaning' as any]);

      expect(useSkipFeedbackStore.getState().getSkipped(wordId)).toEqual(['meaning']);

      useSkipFeedbackStore.getState().clearSkipped(wordId);

      expect(useSkipFeedbackStore.getState().getSkipped(wordId)).toBeNull();
    });
  });

  describe('Scenario 5: Edge cases', () => {
    it('should treat whitespace-only as empty', () => {
      const word: Word = {
        id: 'test-5',
        text: 'owl',
        meaning: '   ',
        example: '\n\t',
        ipa: '  ',
        images: [],
        audio: [],
        learned: false,
      };

      const filled = detectFilledFields(word);
      expect(filled.length).toBe(0);

      const requested = getRequestedFields(word);
      expect(requested.length).toBe(5);
    });

    it('should detect any filled field', () => {
      const word: Word = {
        id: 'test-6',
        text: 'owl',
        meaning: 'bird',
        example: '',
        ipa: undefined,
        images: [],
        audio: [],
        learned: false,
      };

      expect(anyFieldsFilled(word)).toBe(true);
      expect(allFieldsFilled(word)).toBe(false);
    });
  });
});
