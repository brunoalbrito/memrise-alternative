# Contract: Typing practice screen

Route: `/courses/:courseId/practice/:kind` where `kind` is `learn`, `classic` or `speed`. Full-window, no app bar. Reference:
the screenshot supplied with the feature request.

## Layout (desktop, 1024 px and wider)
```text
┌───────────────────────────────────────────────────────────────────────────┐
│ [icon] Course name (link-style title)                      [⌨ toggle] [✕] │  header, M3 top app bar, tonal color
├───────────────────────────────────────────────────────────────────────────┤
│ ▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   [ 0 ] points   │  progress + points badge
│ ┌───────────────┐   WORD                                  ┌─────────────┐  │
│ │               │   ┌─────────────────────────────┐       │      ?      │  │
│ │    image      │   │ typed text                  │       │ I don't know│  │
│ │               │   └─────────────────────────────┘       │  ⌘/Ctrl ↵   │  │
│ └───────────────┘   [m¹][y²][w³][a⁴][h⁵]  [✨ Hint H]     └─────────────┘  │
│                     [t⁶][l⁷][e⁸]           [ ⌫ ]            status icons     │
└───────────────────────────────────────────────────────────────────────────┘
```
Below 720 px: single column (image, input, tiles, buttons stacked); the "I don't know" button moves under the tiles.

## Components and states (M3)
| Component | Behavior |
|-----------|----------|
| Header | Course name, shortcuts toggle (icon button, `aria-pressed`), close button (opens exit dialog) |
| Progress bar | Determinate; value = answered words / words in session; `role="progressbar"` with `aria-valuenow` and text alternative "3 of 10" |
| Points badge | Session points; announces changes politely |
| Image | The word's first image; broken or missing image falls back to the meaning (or example) in a large type card; no alt text revealing the answer (`alt=""`, decorative, with an accessible label "Picture clue") |
| WORD input | M3 outlined text field labeled "WORD"; autofocus; no autocorrect, autocomplete or spellcheck; `lang` set to the course's teaching language; max length = answer length |
| Letter tile | Button with the letter and, when shortcuts are on, its number (1 to 8); states: enabled, hovered, focused, pressed, used (disabled, visually dimmed) |
| Hint | Filled-tonal button; label "Hint" and the key hint `H` when shortcuts are on |
| Backspace tile | Removes the last typed letter; returns its tile |
| I don't know | Large tonal button with `?`; shortcut hint `⌘↵` on macOS, `Ctrl+↵` elsewhere |
| Feedback | Banner under the input: success (primary container), mistake (error container), reveal (tertiary container); `role="status"` / `aria-live="polite"` |
| Exit dialog | Native `<dialog>`: "End this session? Your answers so far are saved." Continue / End session |
| Summary | Full-screen card: words practiced, correct, hints used, points; buttons "Done" and "Practice again" |

## Behavior rules
1. **Tiles**: one per letter of the answer excluding spaces and punctuation; shuffled per word; never in correct order (reshuffle
   once if the shuffle equals the answer, unless the word is a single letter); duplicate letters are separate tiles.
2. **Digits**: keys 1 to 8 pick tiles 1 to 8 when shortcuts are enabled or not (the toggle only controls label visibility);
   disabled for a word that contains digits.
3. **Typing**: a letter typed from the keyboard marks one matching unused tile as used; a letter with no unused tile is
   ignored with a brief shake animation and no state change (respecting reduced motion).
4. **Hint**: fills the next correct letter after the correct prefix (typed text that is wrong is first trimmed back to the
   correct prefix); `H` works when focus is outside the input, `Alt+H` works everywhere; button works always; counts one hint;
   points for the word become `max(1, 10 - 3 * hints)`; rating Hard when completed with hints.
5. **I don't know**: reveals the word in the input (read-only, success-neutral style), records `gave_up` (rating Again,
   0 points), and waits for Enter or a "Next" button before moving on.
6. **Submit**: automatic when the typed length reaches the answer length; also on Enter. Correct: success banner, points added,
   next word after 800 ms (instant with reduced motion). Wrong: error banner, input stays, tiles stay, `attempts += 1`; the first
   wrong attempt of a word is the only one that records a lapse.
7. **Speed review**: a countdown ring (default 8 s per word) appears under the points badge; at zero the word is revealed and
   recorded as `timeout`.
8. **Accent tolerance and case** follow the course settings (research R7).
9. **Close**: `Esc` or the close button opens the exit dialog; ending saves the session as `completed` for answered words and
   `abandoned` flag for the session; unanswered words stay due or new.
10. **Empty session**: if no words qualify, show the "nothing to practice" state with the next due date and a button back.
11. **Focus order**: header controls, input, tiles in order, Hint, backspace, "I don't know"; visible focus ring; the input
    regains focus after each tile or hint action.
12. **Shortcuts toggle** persists (setting `shortcuts.visible`) and defaults to on.

## Data used
Read from `study.next(sessionId)`: `{wordId, text, meaning, example, imageUrl|null, audioUrl|null, index, total}`. Sent with
`study.answer`: `{result, hintsUsed, attempts, elapsedMs}`. Main returns `{rating, points, nextDueAt, sessionTotals}`.
Audio (if any) plays automatically after a correct or revealed answer, with a replay button, unless muted in settings.
