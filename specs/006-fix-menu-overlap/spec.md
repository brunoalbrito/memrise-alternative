# Feature Specification: Fix Course Options Menu Overlap

**Feature Branch**: `006-fix-menu-overlap`

**Created**: 2026-10-18

**Status**: Draft

**Input**: User description: "using speckit i need you to fix this bug alone [screenshot: on a Home course card the open options menu (Set daily goal, Remove course) is partly covered by the card's \"Speed review\" and levels buttons]"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Read and use the options menu without overlap (Priority: P1)

A learner opens the three-dot options menu on a Home course card. The whole menu appears in front of everything else on the page, so every item ("Set daily goal", "Clear goal" when a goal exists, "Remove course") is fully visible and can be clicked. Today the card's "Speed review" (or "Learn new words") button and the levels button are drawn on top of the lower part of the menu, hiding "Remove course" and intercepting clicks.

**Why this priority**: The bug blocks a core action. "Remove course" is hidden and clicking where it should be presses the wrong button.

**Independent Test**: On Home, open the options menu on the first, a middle and the last course card, at desktop and 360 px widths. Verify all menu items are fully visible, nothing from any card is drawn over the menu, and clicking each item runs that item's action.

**Acceptance Scenarios**:

1. **Given** a course card on Home, **When** the learner opens its options menu, **Then** the entire menu is drawn above the card's buttons and stats and above neighboring cards.
2. **Given** the menu is open over the card's action buttons, **When** the learner clicks "Remove course", **Then** the remove confirmation opens and the card's action button is not activated.
3. **Given** the menu is open near the bottom edge of a card, **When** it extends over the next card, **Then** the next card's title, buttons and menu button do not show through or receive the click.
4. **Given** the menu is open, **When** the learner clicks outside it or presses Escape, **Then** it closes and the card behaves as before.

---

### User Story 2 - Card links and buttons keep working (Priority: P1)

The fix must not change how a card behaves otherwise: clicking the title or an empty area of a card still opens the course page, and the primary action, levels button and options button still work on their own.

**Why this priority**: The overlap comes from the layering that makes the whole card clickable, so a careless fix could break opening a course.

**Independent Test**: On Home click a card's title, an empty area of the card, the primary action button, the levels button and the options button. Verify each does only its own action.

**Acceptance Scenarios**:

1. **Given** a course card, **When** the learner clicks its title or an empty area (such as the progress bar or stats area), **Then** the course page opens.
2. **Given** a course card, **When** the learner clicks the primary action button, **Then** only the matching placeholder opens.
3. **Given** a course card, **When** the learner clicks the levels button, **Then** the course page opens.
4. **Given** a course card, **When** the learner opens the options menu, **Then** the course page does not open.

---

### Edge Cases

- Menu opened on the last card of the list: the menu is fully visible and not clipped by the page.
- Two menus: opening one menu closes nothing else, but only one can be opened at a time because opening a second one requires clicking outside the first, which closes it.
- Dark and light schemes: no visual difference in layering.
- The same options menu on the course page (Options button): remains fully visible above the levels and leaderboard.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: An open options menu on a Home course card MUST be drawn in front of all content of its own card and of neighboring cards.
- **FR-002**: Clicks on an open menu's items MUST reach the menu items, never the content beneath.
- **FR-003**: Clicking a card's title or empty area MUST still open the course page.
- **FR-004**: A card's primary action button, levels button and options button MUST remain independently clickable and not open the course page.
- **FR-005**: The options menu on the course page MUST stay fully visible in front of the content below it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of cases the options menu is fully visible in front of the card and its neighbors when opened on any card in the list.
- **SC-002**: The "Remove course" and "Set daily goal" items can be clicked on the first attempt on every card.
- **SC-003**: No regression: opening a course by clicking its card, and each card button, still works in 100% of manual checks.

## Assumptions

- Only the layering (which element is drawn in front) is changed. Menu items, labels and behavior stay the same.
- The bug appears on Home. The course page menu is checked to confirm it is not affected.
- No new dependencies and no change to the data model.
