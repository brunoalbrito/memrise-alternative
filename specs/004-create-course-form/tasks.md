---

description: "Task list for Create Course Form"
---

# Tasks: Create Course Form

**Input**: Design documents from `/specs/004-create-course-form/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md

**Tests**: None. The constitution (v2.0.0) removed the test requirement and the spec does not request tests. Validation is `pnpm typecheck`, `pnpm lint`, `pnpm build` and the manual scenarios in `quickstart.md`.

**Organization**: Tasks are grouped by user story. The feature reuses `Button`, `icons`, `TopAppBar`, `ComingSoonPage`, the router and the learner store from features 001 to 003.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: User story the task belongs to (US1 to US4)

## Conventions for every task

- Paths are relative to the repository root. TypeScript strict, no plain `.js` under `src/`.
- Styling uses Tailwind utilities with the Material Design 3 tokens in `src/app/theme/tokens.css`. Never hard-code colors (constitution Principle V). Error state uses the `error` token.
- No new dependencies (no form or validation library). Cross-feature imports go through the feature's `index.ts` barrel: `create-course` imports from `../home`, and `home` never imports `create-course`.
- Exact user-facing texts (labels, hints, errors) come from `specs/004-create-course-form/contracts/ui-contract.md`. Copy them verbatim.

---

## Phase 1: Foundational (blocks all user stories)

- [x] T001 [P] Extend `src/features/home/model/types.ts`: add `Language { id: string; name: string; icon: string }`; add `CourseDraft { name: string; teachingLanguageId: string; speakersLanguageId: string; tagsInput: string; description: string; shortDescription: string }`; add these optional fields to `Course`: `teachingLanguageId?: string`, `speakersLanguageId?: string`, `tags?: string[]`, `description?: string`, `shortDescription?: string`. Document constraints as comments, verbatim from data-model.md: title "The Name, trimmed, 3 to 100 characters"; tags "At most 10 entries, each at most 30 characters, trimmed, no empty entries, no case-insensitive duplicates"; description "At most 2000 characters"; shortDescription "At most 100 characters".
- [x] T002 Create `src/features/home/data/languages.ts` exporting `languages: Language[]` with ids `en-gb` "English (UK)" 🇬🇧, `en-us` "English (US)" 🇺🇸, `es-mx` "Spanish (Mexico)" 🇲🇽, `ja` "Japanese" 🇯🇵, `pt-br` "Portuguese (Brazil)" 🇧🇷, `fr-fr` "French (France)" 🇫🇷, `de-de` "German" 🇩🇪, `it-it` "Italian" 🇮🇹; `DEFAULT_SPEAKERS_LANGUAGE_ID = "en-gb"`; `getLanguageById(id)`; and `categoryForLanguage(language): Category` returning `{ id: "lang-" + language.id, name: language.name, icon: language.icon }`. Also export `languageCategories: Category[]` (one per language). Depends on T001.
- [x] T003 Update `getCategoryById` in `src/features/home/data/sampleCourses.ts` to search `sampleCategories` first, then `languageCategories` from `languages.ts`. Export a combined `allCategories = [...sampleCategories, ...languageCategories]` from the same file. Depends on T002.
- [x] T004 Update `src/features/home/store/learnerStore.ts`: add `createdCourses: Course[]` (initial `[]`) and `addCourse(draft: CourseDraft): string` that builds a `Course` with `id` `custom-` + `crypto.randomUUID()`, `title` = trimmed name, `categoryId` `lang-<teachingLanguageId>`, `teaching: true`, `totalItems`, `itemsLearned`, `itemsDue` and `learnedToday` all 0, `teachingLanguageId`, `speakersLanguageId`, `tags` from `parseTags(draft.tagsInput)` (imported from `../model/tags`), `description` and `shortDescription` trimmed (empty string stored as `undefined`), appends it to `createdCourses` and returns the id. Change `removeCourse(id)`: if `id` is in `createdCourses`, delete it from `createdCourses` and delete `goals[id]`; otherwise add it to `removedCourseIds` as before. `restoreCourses()` still clears only `removedCourseIds`. Add `createdCourses` to `partialize`; in `merge`, take `saved.createdCourses ?? []` and drop entries whose `teachingLanguageId` is not in the language list or whose counts are not integers >= 0; keep goal and removed-id filtering, and allow goals for created ids. Keep `version: 1`. First create `src/features/home/model/tags.ts` with `parseTags(input: string): string[]`: split on commas, trim, drop empty entries, remove case-insensitive duplicates keeping the first spelling. Depends on T001, T002.
- [x] T005 [P] Create `src/features/home/hooks/useAllCourses.ts` exporting `useAllCourses()` (returns `[...sampleCourses, ...createdCourses]` memoized from the store) and `useCourse(id: string): Course | undefined` (searches `useAllCourses()`). Depends on T004.
- [x] T006 Update `src/features/home/hooks/useFilteredCourses.ts`: use `useAllCourses()` instead of `sampleCourses`, `allCategories` (from T003) instead of `sampleCategories`, and keep the existing fallback-to-all for a category filter with no visible course. Depends on T003, T005.
- [x] T007 Replace `getCourseById` with the hook in `src/features/placeholder/CoursePlaceholder.tsx` (`const course = useCourse(id)`), and update `src/features/home/index.ts` to export `HomePage`, `TopAppBar`, `useCourse`, `useLearnerStore`, `languages`, `DEFAULT_SPEAKERS_LANGUAGE_ID`, `parseTags` and the types `CourseDraft` and `Language`; remove the `getCourseById` export (keep the function itself in `sampleCourses.ts` if still used internally, otherwise delete it). Depends on T005.
- [x] T008 [P] Create `src/features/create-course/model/validation.ts` with `validateCourseForm(draft: CourseDraft): Partial<Record<FieldName, string>>` where `FieldName = "name" | "teachingLanguageId" | "tagsInput" | "description" | "shortDescription"`. Rules, verbatim from FR-003 and FR-004: Name and Teaching required; "Name MUST be 3 to 100 characters after trimming"; "Short description MUST be at most 100 characters"; "Description MUST be at most 2000 characters"; "Tags MUST be comma-separated, with at most 10 tags of at most 30 characters each" (count tags after `parseTags`). Over-limit values are rejected, never truncated. Messages, exact text: empty or spaces-only Name "Enter a name for your course."; Name under 3 "Name must be at least 3 characters."; Name over 100 "Name must be 100 characters or fewer."; no Teaching "Select the language you are teaching."; Short description "Short description must be 100 characters or fewer."; Description "Description must be 2000 characters or fewer."; more than 10 tags "Use at most 10 tags."; a tag over 30 "Each tag must be 30 characters or fewer.". Export `FIELD_ORDER` (name, teachingLanguageId, tagsInput, description, shortDescription) for focus order. Depends on T007 (imports `CourseDraft` and `parseTags` from `../../home`).

**Checkpoint**: `pnpm typecheck` passes and Home still works with the sample courses.

---

## Phase 2: User Story 1 - Create a course from the form (P1) 🎯 MVP

**Goal**: Pressing "Create a course" opens a form page. A valid submit adds the course and opens Home showing it, still there after reload.

**Independent Test**: Open the page from Home, fill Name "My Spanish Verbs" and Teaching "Spanish (Mexico)", press Create Course. Home shows the card with that name, 0%, "0 / 0 items learned" and "Learn new words". It appears under the Teaching filter and the "Spanish (Mexico)" category, survives reload, and can be removed. Double-clicking creates one course.

- [x] T009 [P] [US1] Create `src/features/create-course/components/TextField.tsx`: M3 outlined single-line text field. Props: `id`, `label`, `value`, `onChange`, `hint?`, `error?`, `inputRef?`, `type="text"`. Renders a `<label htmlFor>` above (or in a left column on `sm:` and wider, per the reference), the `<input>`, then the hint and error text below. Sets `aria-invalid` when `error` is present and `aria-describedby` to the ids of the hint and the error. Border `outline-outline-variant`, 2 px `primary` on focus, `error` token when invalid.
- [x] T010 [P] [US1] Create `src/features/create-course/components/TextAreaField.tsx` with the same props and styling as `TextField` for a multi-line `<textarea>` (rows 5, vertically resizable).
- [x] T011 [P] [US1] Create `src/features/create-course/components/SelectField.tsx`: M3 outlined native `<select>` with the same label, hint, error and aria behavior. Props: `id`, `label`, `value`, `onChange`, `options: {value: string; label: string}[]`, `placeholder?` (renders a disabled-looking first option with empty value, "Please select one..."), `suffix?` (text shown after the select, used for "speakers"), `error?`, `hint?`, `inputRef?`.
- [x] T012 [US1] Create `src/features/create-course/hooks/useCourseForm.ts`: state `values: CourseDraft` (initial: empty strings, `speakersLanguageId` = `DEFAULT_SPEAKERS_LANGUAGE_ID`), `errors` (from `validateCourseForm`, empty until the first submit), `storageError: string | null`. `submit(event)`: `event.preventDefault()`; return if a `useRef(false)` `submitted` flag is set; compute errors; if any, set them and return (focus handling is added in US2); probe storage with try/catch around `localStorage.setItem("membetter.probe","1")` then `removeItem`, and on failure set `storageError` to "Could not save your course on this device. Please try again." and return; set `submitted.current = true`, call `useLearnerStore.getState().addCourse(values)`, then `navigate("/")`. On an exception from `addCourse` reset `submitted.current = false` and set the same `storageError`. Imports come from `../../home`. Depends on T007, T008.
- [x] T013 [US1] Create `src/features/create-course/components/CourseForm.tsx`: a `<form noValidate onSubmit={submit}>` using `useCourseForm`, rendering in order Name (`TextField`), Teaching (`SelectField`, options from `languages`, placeholder "Please select one..."), For (`SelectField`, same options, `suffix="speakers"`), Tags (`TextField`), Description (`TextAreaField`), Short description (`TextField`), a dashed divider, and the shared `Button` (`src/shared/ui/Button.tsx`, `variant="filled"`, `type="submit"`) labeled "Create Course". Field labels exactly "Name", "Teaching", "For", "Tags", "Description", "Short description". Hint texts are added in US3. Depends on T009, T010, T011, T012.
- [x] T014 [US1] Create `src/features/create-course/CreateCoursePage.tsx`: `<TopAppBar />` (from `../home`), a `<main>` with a max-width container, an h1 "Create a Course", a "Back to Home" text link to `/` and `<CourseForm />`. Create `src/features/create-course/index.ts` exporting `CreateCoursePage`. Depends on T013.
- [x] T015 [US1] In `src/app/router.tsx` change the `/courses/new` route element from `<ComingSoonPage title="Create a course" />` to `<CreateCoursePage />` (import from `../features/create-course`). Depends on T014.

**Checkpoint**: US1 works alone (create, see on Home, filter, reload, remove).

---

## Phase 3: User Story 2 - Clear feedback on invalid or missing input (P1)

**Goal**: Invalid input blocks submit, shows an error beside each field, marks it, and focuses the first problem. Name has focus when the page opens.

**Independent Test**: Submit the empty form: Name and Teaching show their required messages, nothing is created, focus is on Name. Spaces-only Name is rejected. 101-character Name shows "too long". Fixing a field clears its error as you type.

- [x] T016 [US2] In `src/features/create-course/hooks/useCourseForm.ts` add field refs keyed by field name (`useRef<Partial<Record<FieldName, HTMLElement | null>>>`) and expose `registerRef(name)` returning a ref callback. In `submit`, when errors exist, focus the first invalid field following `FIELD_ORDER` (call `.focus()` on its element). Add `onChange(name, value)` that updates `values` and, if `errors[name]` is currently set, re-runs `validateCourseForm` and updates only that field's error so it clears as soon as it is valid. Depends on T012.
- [x] T017 [US2] In `src/features/create-course/components/CourseForm.tsx` pass `error`, `inputRef` (from `registerRef`) and `onChange` to every field, and render the `storageError` message in a `role="alert"` region above the submit button using the `error` token. Depends on T013, T016.
- [x] T018 [US2] Focus the Name field when the page opens: in `useCourseForm.ts` add a `useEffect` with an empty dependency array that focuses the Name element from the refs map. Depends on T016.

**Checkpoint**: US1 and US2 work together (full create flow with validation).

---

## Phase 4: User Story 3 - Understand each field through hints (P2)

**Goal**: Every field shows its hint, and the "For" row reads "For [language] speakers".

**Independent Test**: Open the form and read every hint text. With the accessibility tree, each field exposes label, hint and error.

- [x] T019 [US3] In `src/features/create-course/components/CourseForm.tsx` pass these exact `hint` texts: Name "Naming your course well will help other learners find it."; Tags "E.g. Spanish vocabulary, learn spanish online, spanish grammar"; Description "Keep the description of the course in the language of what the learners speak."; Short description "A short description for our apps."; Teaching and For have no hint. Confirm the For select shows the suffix "speakers" after it. Depends on T017.
- [x] T020 [US3] Verify in `TextField.tsx`, `TextAreaField.tsx` and `SelectField.tsx` that each hint has a stable id and appears in `aria-describedby` together with the error id (error id only when an error is present); fix if not. Depends on T019.

**Checkpoint**: US3 independently verifiable.

---

## Phase 5: User Story 4 - Side panel and help (P3)

**Goal**: Side panel with reasons and a help link, beside the form on wide screens and below on narrow ones.

**Independent Test**: At desktop width the panel is beside the form, at 360 px below it with no horizontal scroll. The knowledge-base link opens a placeholder with a way back.

- [x] T021 [P] [US4] Create `src/features/create-course/components/HelpPanel.tsx`: a card (`bg-surface-container`, `rounded-m3-lg`, padding) with h2 "Why create a course?", a `<ul>` with exactly "A quick list of personal facts to remember", "Share common content with your classmates/colleagues", "Share awesome teaching materials with the community!", then h2 "Need more help?" and the paragraph "Check out the " + a React Router `Link` to `/help/course-creation` with text "Course Creation knowledge base" + ".". The link has the primary color and underline on focus and hover.
- [x] T022 [US4] In `src/features/create-course/CreateCoursePage.tsx` lay out the form and `HelpPanel` in a grid: one column by default and `lg:grid-cols-[minmax(0,1fr)_20rem]` with gap, so the panel is below the form on narrow screens. Ensure no horizontal scroll at 360 px. Depends on T014, T021.
- [x] T023 [US4] In `src/app/router.tsx` add the route `{ path: "/help/course-creation", element: <ComingSoonPage title="Course Creation knowledge base" /> }`. Depends on T015.

**Checkpoint**: all stories work.

---

## Phase 6: Polish & Cross-Cutting

- [x] T024 Run `pnpm typecheck && pnpm lint && pnpm build` and fix all errors.
- [ ] T025 Walk through every scenario in `specs/004-create-course-form/quickstart.md` in the browser (`pnpm dev`): create and reload, filters and category, remove and restore, placeholders naming the new course, validation messages and focus, optional-field limits, tags parsing, double-submit, hints, side panel at desktop and 360 px, leaving without saving, dark scheme. Fix any deviation.

---

## Dependencies & Execution Order

- Phase 1 first. Inside it: T001 then T002 then T003 and T004; T005 after T004; T006 after T003 and T005; T007 after T005; T008 after T007. T001 and T008 can start in parallel only if T008's imports are stubbed, so run T008 after T007.
- US1 needs Phase 1. US2 needs US1 (it edits `useCourseForm.ts` and `CourseForm.tsx`). US3 needs US2's `CourseForm.tsx` wiring. US4 needs US1's page and router, and is otherwise independent of US2 and US3.
- Priority order: US1, US2 (P1), US3 (P2), US4 (P3).
- `useCourseForm.ts` is edited by T012, T016 and T018, `CourseForm.tsx` by T013, T017 and T019, and `router.tsx` by T015 and T023, so those tasks run in sequence.

## Parallel Opportunities

- Phase 1: T001 alone first; then T005 and T008 can proceed in parallel once their prerequisites are done.
- US1: T009, T010 and T011 together (three different files).
- US4: T021 (HelpPanel) can be built in parallel with US2 and US3 work, since it is a new file.

## Implementation Strategy

- **MVP**: Phase 1 and US1 (T001 to T015): a working form that creates courses. Add US2 immediately after, since a form without validation can create unusable courses.
- **Increment 2**: US2 (validation and focus), then US3 (hints).
- **Increment 3**: US4 (side panel and help route), then Polish.
- Stop after each checkpoint and run the matching quickstart scenarios.
