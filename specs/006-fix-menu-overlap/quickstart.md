# Quickstart: Validating the Menu Overlap Fix

## Static checks

```bash
pnpm typecheck && pnpm lint && pnpm build
```

Expected: all three exit 0.

## Run

```bash
pnpm dev
```

## Scenarios

1. **Menu in front (US1)**: On Home open the three-dot menu on the first card. All items are fully
   visible and nothing from the card (Speed review, levels button) is drawn over it. Click
   "Remove course": the confirmation opens and the card's action button is not pressed.
2. **Over the next card (US1)**: Open the menu on a middle card: it is in front of the next
   card's title, buttons and three-dot button. Click an item that sits over them: the menu item
   is activated, not the card beneath.
3. **Last card (US1)**: Open the menu on the last card: fully visible, not clipped.
4. **Close (US1)**: Click outside or press Escape: the menu closes.
5. **Phone width (US1)**: Repeat scenario 1 at 360 px width.
6. **Card clicks (US2)**: Click a card title and an empty area (progress bar, stats): the course
   page opens. Click the primary action: only its placeholder opens. Click the levels button:
   the course page opens. Click the three-dot button: only the menu opens.
7. **Course page menu**: On a course page open "Options": fully visible over the levels and
   leaderboard.

Contract: [ui-contract.md](./contracts/ui-contract.md).
