import { describe, expect, it } from "vitest";
import { buildOptions, chooseExercise, EXERCISE_KINDS, stageOf, type PoolWord } from "../../src/features/practice/model/exercises";
import { exercisePoints } from "../../src/features/practice/model/points";
import { mulberry32 } from "../../src/features/practice/model/tiles";
import type { Word } from "../../src/features/home/model/types";

const w = (id: string, over: Partial<Word> = {}): Word => ({
  id,
  text: id,
  meaning: `meaning of ${id}`,
  example: "",
  images: [{ id: `img-${id}`, name: `${id}.png`, type: "image/png", size: 1 }],
  audio: [{ id: `aud-${id}`, name: `${id}.wav`, type: "audio/wav", size: 1 }],
  learned: false,
  ...over,
});
const pool = (words: Word[], level = "l1"): PoolWord[] => words.map((word) => ({ word, levelId: level }));
const rich = ["sink", "wash", "hamper", "rhythm", "humid"].map((id) => w(id));
const rng = () => mulberry32(7);

describe("buildOptions", () => {
  it("builds four different options with exactly one right answer for every choice kind", () => {
    for (const kind of ["word-to-image", "image-to-word", "word-to-meaning", "meaning-to-word", "audio-to-word", "word-to-audio"] as const) {
      for (let seed = 1; seed <= 30; seed += 1) {
        const ex = buildOptions(kind, rich[0]!, "l1", pool(rich), mulberry32(seed))!;
        expect(ex.options).toHaveLength(4);
        const keys = ex.options.map((o) => o.imageId ?? o.audioId ?? o.text!.toLowerCase());
        expect(new Set(keys).size).toBe(4);
        const right = ex.options[ex.correct]!;
        const expected = { "word-to-image": { imageId: "img-sink" }, "image-to-word": { text: "sink" }, "word-to-meaning": { text: "meaning of sink" }, "meaning-to-word": { text: "sink" }, "audio-to-word": { text: "sink" }, "word-to-audio": { audioId: "aud-sink" } }[kind];
        expect(right).toEqual(expected);
      }
    }
  });

  it("moves the right answer around", () => {
    const positions = new Set(Array.from({ length: 60 }, (_, s) => buildOptions("image-to-word", rich[0]!, "l1", pool(rich), mulberry32(s + 1))!.correct));
    expect(positions.size).toBe(4);
  });

  it("is not possible when the word lacks what the kind needs", () => {
    const noImage = w("a", { images: [] });
    expect(buildOptions("word-to-image", noImage, "l1", pool([noImage, ...rich]), rng())).toBeNull();
    expect(buildOptions("image-to-word", noImage, "l1", pool([noImage, ...rich]), rng())).toBeNull();
    const noMeaning = w("b", { meaning: "  " });
    expect(buildOptions("word-to-meaning", noMeaning, "l1", pool([noMeaning, ...rich]), rng())).toBeNull();
    const noAudio = w("c", { audio: [] });
    expect(buildOptions("audio-to-word", noAudio, "l1", pool([noAudio, ...rich]), rng())).toBeNull();
    expect(buildOptions("audio-to-type", noAudio, "l1", pool([noAudio, ...rich]), rng())).toBeNull();
  });

  it("is not possible when the course is too small or has too few suitable words", () => {
    expect(buildOptions("image-to-word", rich[0]!, "l1", pool(rich.slice(0, 3)), rng())).toBeNull();
    // Other words without a picture cannot be picture options.
    const bare = rich.slice(1).map((x) => ({ ...x, images: [] }));
    expect(buildOptions("word-to-image", rich[0]!, "l1", pool([rich[0]!, ...bare]), rng())).toBeNull();
    expect(buildOptions("image-to-word", rich[0]!, "l1", pool([rich[0]!, ...bare]), rng())).not.toBeNull(); // words need no picture
  });

  it("never offers repeated words, meanings or pictures", () => {
    const same = [rich[0]!, w("x", { text: "SINK" }), w("y", { text: " sink " }), ...rich.slice(1)];
    for (let s = 1; s <= 30; s += 1) {
      const ex = buildOptions("image-to-word", same[0]!, "l1", pool(same), mulberry32(s))!;
      expect(ex.options.map((o) => o.text!.toLowerCase().trim()).filter((t) => t === "sink")).toHaveLength(1);
    }
    const sameMeaning = [rich[0]!, ...rich.slice(1).map((x) => ({ ...x, meaning: "meaning of sink" }))];
    expect(buildOptions("word-to-meaning", sameMeaning[0]!, "l1", pool(sameMeaning), rng())).toBeNull();
    const samePicture = [rich[0]!, ...rich.slice(1).map((x) => ({ ...x, images: [{ id: "img-sink", name: "a", type: "image/png", size: 1 }] }))];
    expect(buildOptions("word-to-image", samePicture[0]!, "l1", pool(samePicture), rng())).toBeNull();
    const blank = [rich[0]!, ...rich.slice(1).map((x) => ({ ...x, meaning: "" }))];
    expect(buildOptions("word-to-meaning", blank[0]!, "l1", pool(blank), rng())).toBeNull();
  });

  it("prefers words of the same level and ignores the word itself", () => {
    const near = ["n1", "n2", "n3"].map((id) => w(id));
    const far = ["f1", "f2", "f3", "f4"].map((id) => w(id));
    const mixed = [...pool([rich[0]!, ...near], "A"), ...pool(far, "B")];
    for (let s = 1; s <= 20; s += 1) {
      const ex = buildOptions("image-to-word", rich[0]!, "A", mixed, mulberry32(s))!;
      expect(ex.options.map((o) => o.text).sort()).toEqual(["n1", "n2", "n3", "sink"]);
    }
  });

  it("typing kinds have no options", () => {
    expect(buildOptions("type", rich[0]!, "l1", pool(rich), rng())).toEqual({ kind: "type", options: [], correct: 0 });
    expect(buildOptions("type", w("e", { images: [], meaning: "", audio: [] }), "l1", [], rng())).toBeNull();
    expect(buildOptions("type", w("e", { images: [], meaning: "" }), "l1", [], rng())).toBeNull(); // audio alone is not something to see
  });
});

describe("chooseExercise", () => {
  const base = { word: rich[0]!, levelId: "l1", pool: pool(rich), enabled: EXERCISE_KINDS, seed: 1 };
  const kinds = (input: Partial<Parameters<typeof chooseExercise>[0]>, n = 80) =>
    new Set(Array.from({ length: n }, (_, s) => chooseExercise({ ...base, stage: "new", session: "learn", ...input, seed: s + 1 }).kind));

  it("gives new and just-learned words choices, and review words mostly typing and listening", () => {
    expect([...kinds({ stage: "new" })].every((k) => !["type", "audio-to-type"].includes(k))).toBe(true);
    expect([...kinds({ stage: "learning", session: "classic" })].every((k) => !["type", "audio-to-type"].includes(k))).toBe(true);
    const review = Array.from({ length: 200 }, (_, s) => chooseExercise({ ...base, stage: "review", session: "classic", seed: s + 1 }).kind);
    const hardShare = review.filter((k) => k === "type" || k === "audio-to-type").length / review.length;
    expect(hardShare).toBeGreaterThan(0.55);
    expect(hardShare).toBeLessThan(0.95);
    expect(new Set(review).size).toBeGreaterThan(2);
  });

  it("uses only choices in speed review", () => {
    expect([...kinds({ stage: "review", session: "speed" })].every((k) => k !== "type" && k !== "audio-to-type")).toBe(true);
  });

  it("is stable for the same seed and varied across seeds", () => {
    expect(chooseExercise({ ...base, stage: "new", session: "learn", seed: 5 })).toEqual(chooseExercise({ ...base, stage: "new", session: "learn", seed: 5 }));
    expect(kinds({ stage: "new" }).size).toBeGreaterThan(3);
  });

  it("respects the kinds that are turned on", () => {
    expect([...kinds({ enabled: ["word-to-meaning"] })]).toEqual(["word-to-meaning"]);
    expect([...kinds({ enabled: ["type"], stage: "new" })]).toEqual(["type"]);
    expect([...kinds({ enabled: ["audio-to-word", "audio-to-type"], stage: "review", session: "classic" })].sort()).toEqual(["audio-to-type", "audio-to-word"]);
  });

  it("falls back to typing when nothing that is on is possible, and to hearing when there is no prompt", () => {
    const small = { ...base, pool: pool(rich.slice(0, 2)), enabled: ["word-to-image"] as const };
    expect(chooseExercise({ ...small, stage: "new", session: "learn" }).kind).toBe("type");
    const audioOnly = w("z", { images: [], meaning: "", example: "" });
    expect(chooseExercise({ ...base, word: audioOnly, pool: pool([audioOnly]), enabled: ["type"], stage: "new", session: "learn" }).kind).toBe("audio-to-type");
  });

  it("a word with only a meaning uses meaning exercises or typing, never pictures or audio", () => {
    const onlyMeaning = w("m", { images: [], audio: [] });
    const set = kinds({ word: onlyMeaning, pool: pool([onlyMeaning, ...rich]) });
    expect([...set].every((k) => ["word-to-meaning", "meaning-to-word"].includes(k))).toBe(true);
  });
});

describe("stage and points", () => {
  it("maps card states to stages", () => {
    expect([undefined, 0, 1, 2, 3].map(stageOf)).toEqual(["new", "new", "learning", "review", "learning"]);
  });
  it("gives half the points for a choice", () => {
    expect(exercisePoints(false, "correct", 0)).toBe(10);
    expect(exercisePoints(true, "correct", 0)).toBe(5);
    expect(exercisePoints(true, "wrong", 0)).toBe(5);
    expect(exercisePoints(true, "gave_up", 0)).toBe(0);
    expect(exercisePoints(true, "timeout", 0)).toBe(0);
  });
});
