/**
 * The sample course for development and demos: one course with a picture and a recording for every word, so typing, picture and listening exercises, speed review, levels and editing can all be tried. It is NOT part of the app: `pnpm samples` turns them into a
 * `.membetter` library file that you import like any other file (Import button on Home).
 */

export interface SampleWord {
  id: string;
  text: string;
  meaning: string;
  example: string;
  /** The word has a generated picture. */
  image: boolean;
  /** The word has a generated recording. */
  audio: boolean;
}
export interface SampleLevel {
  id: string;
  name: string;
  tested: string;
  words: SampleWord[];
}
export interface SampleCourse {
  id: string;
  title: string;
  teachingLanguageId: string;
  speakersLanguageId: string;
  levels: SampleLevel[];
}

type Seed = {
  name: string;
  tested: string;
  words: [text: string, meaning: string, example?: string][];
};

interface CourseSeed {
  /** Pictures and/or recordings generated for every word of the course. */
  media?: { image?: boolean; audio?: boolean };
  levels: Seed[];
}

const TEST_WORD = "Test on Word, prompt with Images.";
const TEST_MEANING = "Test on Meaning, prompt with Word.";

const seeds: Record<string, CourseSeed> = {
  "pictures-and-sounds": {
    media: { image: true, audio: true },
    levels: [
      { name: "Animals", tested: TEST_WORD, words: [["cat", "a small furry pet", "The cat sleeps."], ["dog", "a pet that barks", "The dog runs."], ["bird", "an animal that flies", "A bird sings."], ["fish", "an animal that swims", "The fish is red."], ["horse", "a large animal people ride"], ["mouse", "a very small furry animal"]] },
      { name: "Things", tested: TEST_MEANING, words: [["table", "furniture with a flat top", "Put it on the table."], ["chair", "a seat for one person"], ["window", "an opening in a wall with glass"], ["door", "you open it to enter a room"], ["lamp", "gives light in a room"], ["clock", "shows the time"]] },
    ],
  },
};

const info: Record<string, { title: string; teaching: string; speakers: string }> = {
  "pictures-and-sounds": { title: "Sample Course: Pictures and Sounds", teaching: "en-gb", speakers: "en-gb" },
};

export const sampleCourses: SampleCourse[] = Object.entries(seeds).map(([key, seed]) => ({
  id: `custom-sample-${key}`,
  title: info[key]!.title,
  teachingLanguageId: info[key]!.teaching,
  speakersLanguageId: info[key]!.speakers,
  levels: seed.levels.map((level, i) => ({
    id: `sample-${key}-l${i}`,
    name: level.name,
    tested: level.tested,
    words: level.words.map(([text, meaning, example], j) => ({
      id: `sample-${key}-l${i}-w${j}`,
      text,
      meaning,
      example: example ?? "",
      image: seed.media?.image ?? false,
      audio: seed.media?.audio ?? false,
    })),
  })),
}));
