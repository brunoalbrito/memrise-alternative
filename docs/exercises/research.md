# Research: Memrise exercise types

Searched on 2026-10-18. Sources: the Memrise Users Wiki ([Tapping Test](https://memrise-users.fandom.com/wiki/Tapping_Test),
[how to create a no-typing course](https://memrise-users.fandom.com/wiki/How_to_create_a_no-typing_course)), Memrise's
[help](https://explore.memrise.com/help) and [product roundup](https://www.memrise.com/blog/january-2022-product-roundup), and the
AnkiWeb forum thread about [recreating the Memrise card template](https://forums.ankiweb.net/t/memrise-card-template-support-thread/34233).
The sources describe the types in general terms; the exact mix and order are not documented in detail, so the design below is a
reasonable reproduction, not a copy.

## What Memrise uses
| Type | What the learner does | Notes from the sources |
|------|-----------------------|------------------------|
| Multiple choice | Sees a prompt and picks the right answer among several | Answers are submitted as soon as a button is clicked; one correct choice |
| Reversed multiple choice | The same in the other direction (answer to prompt) | Used for words and meanings, and for pictures in visual courses |
| Listening (audio) | Hears a recording and picks (or types) the word | Needs audio on the item |
| Typing | Types the answer | In classic review a course can test typing only |
| Tapping | Rearranges words or letters by tapping them | Replaces multiple choice at some points in "planting" and "watering"; can be answered with number keys |
| Speaking | Says the word | Out of scope here (needs speech recognition) |

Sessions are split into learning new items (easier recognition types first) and reviewing (harder recall types: typing, listening),
driven by spaced repetition. Courses can limit types (for example "no typing").

## What this app already has
Typing from a picture or meaning with letter tiles (the tapping test), hints, give up, speed timer, FSRS scheduling.

## What is added
- 027: picture, word and meaning multiple choice in both directions (word to picture, picture to word, word to meaning, meaning to word).
- 028: listening: hear a word and pick the text, see a word and pick the recording, hear a word and type it.
- 029: choose which exercise types are on (for example "no typing"), saved on this computer.
- A selector picks an exercise per word: easier choices while a word is new or just learned, harder typing and listening for words
  in review, always limited to what a word has (a picture, audio, a meaning) and to the types the learner turned on.
