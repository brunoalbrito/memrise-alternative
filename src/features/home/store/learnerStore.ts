import { create } from "zustand";
import { getApi, isDesktop } from "../../../shared/api";
import type { LibraryChange } from "../../../../electron/shared/schemas";
import { deleteMedia } from "../../../shared/media/mediaStore";
import { sampleCourses } from "../data/sampleCourses";
import { sampleLevels } from "../data/sampleLevels";
import { parseTags } from "../model/tags";
import {
  type Course,
  type CourseDraft,
  type CourseEdit,
  type CourseLevel,
  type GoalValue,
} from "../model/types";

export class CourseNotFoundError extends Error {
  constructor() {
    super("Course not found");
    this.name = "CourseNotFoundError";
  }
}

export type SaveStatus = "idle" | "saving" | "saved" | "failed";

interface LearnerState {
  /** False until the stored library has been loaded (always true in the browser build). */
  ready: boolean;
  loadError: string | null;
  saveStatus: SaveStatus;
  hydrate: () => Promise<void>;
  retrySave: () => void;
  goals: Record<string, GoalValue>;
  removedCourseIds: string[];
  createdCourses: Course[];
  courseEdits: Record<string, CourseEdit>;
  courseLevels: Record<string, CourseLevel[]>;
  setGoal: (courseId: string, value: GoalValue | null) => void;
  removeCourse: (courseId: string) => void;
  restoreCourses: () => void;
  addCourse: (draft: CourseDraft) => string;
  updateCourse: (courseId: string, draft: CourseDraft) => void;
  setCourseLevels: (courseId: string, levels: CourseLevel[]) => void;
}

const sampleIds = new Set(sampleCourses.map((course) => course.id));

function buildEdit(base: Course, draft: CourseDraft): CourseEdit {
  const tags = parseTags(draft.tagsInput);
  const description = draft.description.trim();
  const shortDescription = draft.shortDescription.trim();
  const languageChanged = draft.teachingLanguageId !== base.teachingLanguageId;
  return {
    title: draft.name.trim(),
    teachingLanguageId: draft.teachingLanguageId,
    speakersLanguageId: draft.speakersLanguageId,
    tags: tags.length > 0 ? tags : undefined,
    description: description === "" ? undefined : description,
    shortDescription: shortDescription === "" ? undefined : shortDescription,
    categoryId: languageChanged
      ? `lang-${draft.teachingLanguageId}`
      : base.categoryId,
  };
}

function levelsOf(
  courseLevels: Record<string, CourseLevel[]>,
  courseId: string,
): CourseLevel[] {
  return courseLevels[courseId] ?? sampleLevels[courseId] ?? [];
}

function referencedMediaIds(
  courseLevels: Record<string, CourseLevel[]>,
  courseIds: string[],
): Set<string> {
  const ids = new Set<string>();
  for (const courseId of courseIds) {
    for (const level of levelsOf(courseLevels, courseId)) {
      for (const word of level.words) {
        for (const ref of [...word.images, ...word.audio]) ids.add(ref.id);
      }
    }
  }
  return ids;
}

function allCourseIds(createdCourses: Course[]): string[] {
  return [...sampleIds, ...createdCourses.map((course) => course.id)];
}

/** Deletes stored files that were referenced before a change and are not referenced after it. */
function cleanupMedia(before: Set<string>, after: Set<string>) {
  for (const id of before) {
    if (!after.has(id)) deleteMedia(id).catch(() => {});
  }
}

const LEVEL_SAVE_DELAY_MS = 400;

/** Changes are written in order, one at a time. Failed ones are kept so the user can retry. */
let queue: Promise<void> = Promise.resolve();
let failed: LibraryChange[] = [];
const levelTimers = new Map<string, ReturnType<typeof setTimeout>>();

function send(change: LibraryChange): void {
  if (!isDesktop()) return;
  useLearnerStore.setState({ saveStatus: "saving" });
  queue = queue.then(async () => {
    let ok: boolean;
    try {
      ok = (await getApi().library.apply(change)).ok;
    } catch {
      ok = false;
    }
    if (!ok) failed.push(change);
    useLearnerStore.setState({
      saveStatus: failed.length > 0 ? "failed" : "saved",
    });
  });
}

function flushLevels(courseId: string): void {
  const timer = levelTimers.get(courseId);
  if (timer === undefined) return;
  clearTimeout(timer);
  levelTimers.delete(courseId);
  const levels = useLearnerStore.getState().courseLevels[courseId];
  if (levels) send({ type: "saveLevels", courseId, levels });
}

function scheduleLevels(courseId: string): void {
  const existing = levelTimers.get(courseId);
  if (existing !== undefined) clearTimeout(existing);
  if (isDesktop()) useLearnerStore.setState({ saveStatus: "saving" });
  levelTimers.set(
    courseId,
    setTimeout(() => flushLevels(courseId), LEVEL_SAVE_DELAY_MS),
  );
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    for (const courseId of [...levelTimers.keys()]) flushLevels(courseId);
  });
}

export const useLearnerStore = create<LearnerState>()((set, get) => ({
  ready: !isDesktop(),
  loadError: null,
  saveStatus: "idle",
  goals: {},
  removedCourseIds: [],
  createdCourses: [],
  courseEdits: {},
  courseLevels: {},
  hydrate: async () => {
    if (!isDesktop()) {
      set({ ready: true });
      return;
    }
    try {
      const result = await getApi().library.load();
      if (!result.ok) {
        set({ loadError: result.error.message });
        return;
      }
      const data = result.data;
      set({
        ready: true,
        loadError: null,
        goals: data.goals,
        removedCourseIds: data.removedCourseIds,
        createdCourses: data.createdCourses,
        courseEdits: data.courseEdits,
        courseLevels: data.courseLevels,
      });
    } catch {
      set({ loadError: "The library could not be loaded." });
    }
  },
  retrySave: () => {
    const retry = failed;
    failed = [];
    for (const change of retry) send(change);
  },
  setGoal: (courseId, value) => {
    set((state) => {
      const goals = { ...state.goals };
      if (value === null) delete goals[courseId];
      else goals[courseId] = value;
      return { goals };
    });
    send({ type: "setGoal", courseId, value });
  },
  removeCourse: (courseId) => {
    const state = get();
    const ids = allCourseIds(state.createdCourses);
    const before = referencedMediaIds(state.courseLevels, ids);
    const courseLevels = { ...state.courseLevels };
    delete courseLevels[courseId];
    levelTimers.delete(courseId);
    if (state.createdCourses.some((course) => course.id === courseId)) {
      const goals = { ...state.goals };
      delete goals[courseId];
      const createdCourses = state.createdCourses.filter((course) => course.id !== courseId);
      cleanupMedia(before, referencedMediaIds(courseLevels, allCourseIds(createdCourses)));
      set({ createdCourses, goals, courseLevels });
      send({ type: "deleteCourse", courseId });
      return;
    }
    if (state.removedCourseIds.includes(courseId)) return;
    const courseEdits = { ...state.courseEdits };
    delete courseEdits[courseId];
    cleanupMedia(before, referencedMediaIds(courseLevels, ids));
    set({
      removedCourseIds: [...state.removedCourseIds, courseId],
      courseEdits,
      courseLevels,
    });
    send({ type: "hideCourse", courseId });
  },
  restoreCourses: () => {
    set({ removedCourseIds: [] });
    send({ type: "restoreHidden" });
  },
  addCourse: (draft) => {
    const id = `custom-${crypto.randomUUID()}`;
    const tags = parseTags(draft.tagsInput);
    const description = draft.description.trim();
    const shortDescription = draft.shortDescription.trim();
    const course: Course = {
      id,
      title: draft.name.trim(),
      categoryId: `lang-${draft.teachingLanguageId}`,
      teaching: true,
      totalItems: 0,
      itemsLearned: 0,
      itemsDue: 0,
      learnedToday: 0,
      teachingLanguageId: draft.teachingLanguageId,
      speakersLanguageId: draft.speakersLanguageId,
      tags: tags.length > 0 ? tags : undefined,
      description: description === "" ? undefined : description,
      shortDescription: shortDescription === "" ? undefined : shortDescription,
    };
    set((state) => ({
      createdCourses: [...state.createdCourses, course],
      courseLevels: { ...state.courseLevels, [id]: [] },
    }));
    send({ type: "upsertCourse", course });
    return id;
  },
  setCourseLevels: (courseId, levels) => {
    const state = get();
    const ids = allCourseIds(state.createdCourses);
    const before = referencedMediaIds(state.courseLevels, ids);
    const courseLevels = { ...state.courseLevels, [courseId]: levels };
    cleanupMedia(before, referencedMediaIds(courseLevels, ids));
    set({ courseLevels });
    scheduleLevels(courseId);
  },
  updateCourse: (courseId, draft) => {
    const state = get();
    const created = state.createdCourses.find((c) => c.id === courseId);
    const sample = sampleCourses.find((c) => c.id === courseId);
    if (!created && (!sample || state.removedCourseIds.includes(courseId))) {
      throw new CourseNotFoundError();
    }
    if (created) {
      const updated: Course = { ...created, ...buildEdit(created, draft) };
      set({
        createdCourses: state.createdCourses.map((c) => (c.id === courseId ? updated : c)),
      });
      send({ type: "upsertCourse", course: updated });
      return;
    }
    const base: Course = { ...sample!, ...state.courseEdits[courseId] };
    const edit = buildEdit(base, draft);
    set({ courseEdits: { ...state.courseEdits, [courseId]: edit } });
    send({ type: "setEdit", courseId, edit });
  },
}));
