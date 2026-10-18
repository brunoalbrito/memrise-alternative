import type { CourseLevel } from "../model/types";

type Seed = {
  name: string;
  tested: string;
  words: [text: string, meaning: string, example?: string][];
};

interface CourseSeed {
  learned: number;
  levels: Seed[];
}

const TEST_WORD = "Test on Word, prompt with Images.";
const TEST_MEANING = "Test on Meaning, prompt with Word.";

const seeds: Record<string, CourseSeed> = {
  "english-visual-dictionary": {
    learned: 9,
    levels: [
      {
        name: "First Level",
        tested: TEST_WORD,
        words: [
          ["sink", "a bowl that is attached to the wall in a kitchen or bathroom in which you wash dishes or your hands"],
          ["wash", "to clean something using water"],
          ["laundry folding", "fold clothes after they have been washed and dried"],
          ["hamper", "a container used for carrying dirty clothes"],
          ["rhythm", "a strong pattern of sounds, words, or musical notes"],
          ["humid", "containing extremely small drops of water in the air"],
          ["variant", "related to another thing but is not exactly the same"],
        ],
      },
      {
        name: "Second Level",
        tested: TEST_WORD,
        words: [
          ["ladder", "a set of steps fixed between two long pieces of wood or metal"],
          ["pillow", "a soft object you rest your head on in bed"],
          ["curtain", "a piece of cloth that hangs across a window"],
          ["shelf", "a flat board fixed to a wall for keeping things on"],
          ["carpet", "a thick soft covering for a floor"],
        ],
      },
      {
        name: "New level",
        tested: TEST_MEANING,
        words: [
          ["bridge", "a structure built over a river or road so people can cross it"],
          ["market", "a place where people buy and sell goods"],
          ["pavement", "a path at the side of a road for people walking"],
          ["traffic light", "a signal with red, amber and green lights that controls traffic"],
        ],
      },
    ],
  },
  "irregular-verbs": {
    learned: 0,
    levels: [
      { name: "Common Verbs", tested: TEST_MEANING, words: [["be", "was / were / been"], ["have", "had / had"], ["do", "did / done"]] },
      { name: "Past Forms", tested: TEST_MEANING, words: [["go", "went / gone"], ["see", "saw / seen"], ["take", "took / taken"]] },
      { name: "Tricky Verbs", tested: TEST_MEANING, words: [["lie", "lay / lain"], ["lay", "laid / laid"], ["rise", "rose / risen"]] },
      { name: "Review Set", tested: TEST_MEANING, words: [["write", "wrote / written"], ["speak", "spoke / spoken"], ["break", "broke / broken"]] },
    ],
  },
  "english-polyglot": {
    learned: 0,
    levels: [
      { name: "Greetings", tested: TEST_MEANING, words: [["hello", "a common greeting"], ["good morning", "a greeting used before noon"], ["see you later", "a friendly goodbye"], ["nice to meet you", "said when meeting someone for the first time"]] },
      { name: "Daily Life", tested: TEST_MEANING, words: [["commute", "to travel regularly between home and work"], ["groceries", "food and other items bought at a shop"], ["chore", "a small job you do regularly at home"], ["appointment", "an arranged time to meet someone"]] },
      { name: "Opinions", tested: TEST_MEANING, words: [["I reckon", "I think"], ["in my view", "according to my opinion"], ["on the other hand", "used to give a different point of view"], ["to be honest", "used before saying what you really think"]] },
    ],
  },
  "japanese-hiragana": {
    learned: 10,
    levels: [
      { name: "Vowels and K", tested: TEST_MEANING, words: [["あ", "a"], ["い", "i"], ["う", "u"], ["え", "e"], ["お", "o"]] },
      { name: "S and T", tested: TEST_MEANING, words: [["さ", "sa"], ["し", "shi"], ["す", "su"], ["せ", "se"], ["そ", "so"]] },
    ],
  },
  "japanese-n5-vocab": {
    learned: 5,
    levels: [
      { name: "Numbers", tested: TEST_MEANING, words: [["一", "one"], ["二", "two"], ["三", "three"], ["四", "four"]] },
      { name: "People", tested: TEST_MEANING, words: [["私", "I, me"], ["友達", "friend"], ["先生", "teacher"], ["学生", "student"]] },
      { name: "Time", tested: TEST_MEANING, words: [["今日", "today"], ["明日", "tomorrow"], ["昨日", "yesterday"], ["今", "now"]] },
    ],
  },
  "spanish-mexico-basics": {
    learned: 4,
    levels: [
      { name: "Greetings", tested: TEST_MEANING, words: [["hola", "hello"], ["buenos días", "good morning"], ["buenas noches", "good night"], ["¿cómo estás?", "how are you?"], ["mucho gusto", "nice to meet you"]] },
      { name: "Ordering Food", tested: TEST_MEANING, words: [["la cuenta", "the bill"], ["un taco", "a taco"], ["agua, por favor", "water, please"], ["está delicioso", "it is delicious"], ["sin picante", "not spicy"]] },
    ],
  },
  "networking-fundamentals": {
    learned: 2,
    levels: [
      { name: "Layers", tested: TEST_MEANING, words: [["physical layer", "the layer that moves raw bits over a medium"], ["data link layer", "the layer that moves frames between neighboring devices"], ["network layer", "the layer that routes packets between networks"], ["transport layer", "the layer that provides end-to-end delivery"]] },
      { name: "Addressing", tested: TEST_MEANING, words: [["IP address", "a number that identifies a device on a network"], ["subnet mask", "a value that splits an address into network and host parts"], ["MAC address", "a hardware address of a network interface"], ["gateway", "a device that connects a network to other networks"]] },
    ],
  },
};

export const sampleLevels: Record<string, CourseLevel[]> = Object.fromEntries(
  Object.entries(seeds).map(([courseId, seed]) => {
    let learnedLeft = seed.learned;
    const levels: CourseLevel[] = seed.levels.map((level, i) => ({
      id: `sample-${courseId}-l${i}`,
      name: level.name,
      tested: level.tested,
      words: level.words.map(([text, meaning, example], j) => {
        const learned = learnedLeft > 0;
        if (learned) learnedLeft -= 1;
        return {
          id: `sample-${courseId}-l${i}-w${j}`,
          text,
          meaning,
          example: example ?? "",
          images: [],
          audio: [],
          learned,
        };
      }),
    }));
    return [courseId, levels];
  }),
);
