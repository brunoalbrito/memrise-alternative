import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getLanguageById } from "../data/languages";
import { deleteMedia } from "../../../shared/media/mediaStore";
import { sampleCourses } from "../data/sampleCourses";
import { sampleLevels } from "../data/sampleLevels";
import { parseTags } from "../model/tags";
import {
  GOAL_VALUES,
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

interface LearnerState {
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

type PersistedLearner = Pick<
  LearnerState,
  "goals" | "removedCourseIds" | "createdCourses" | "courseEdits" | "courseLevels"
>;

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

function isNonNegativeInteger(value: unknown): boolean {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isValidCreatedCourse(course: Course): boolean {
  return (
    typeof course.id === "string" &&
    typeof course.title === "string" &&
    course.teachingLanguageId !== undefined &&
    getLanguageById(course.teachingLanguageId) !== undefined &&
    isNonNegativeInteger(course.totalItems) &&
    isNonNegativeInteger(course.itemsLearned) &&
    isNonNegativeInteger(course.itemsDue) &&
    isNonNegativeInteger(course.learnedToday)
  );
}

export const useLearnerStore = create<LearnerState>()(
  persist(
    (set) => ({
      goals: {},
      removedCourseIds: [],
      createdCourses: [],
      courseEdits: {},
      courseLevels: {},
      setGoal: (courseId, value) =>
        set((state) => {
          const goals = { ...state.goals };
          if (value === null) delete goals[courseId];
          else goals[courseId] = value;
          return { goals };
        }),
      removeCourse: (courseId) =>
        set((state) => {
          const ids = allCourseIds(state.createdCourses);
          const before = referencedMediaIds(state.courseLevels, ids);
          const courseLevels = { ...state.courseLevels };
          delete courseLevels[courseId];
          if (state.createdCourses.some((course) => course.id === courseId)) {
            const goals = { ...state.goals };
            delete goals[courseId];
            const createdCourses = state.createdCourses.filter(
              (course) => course.id !== courseId,
            );
            cleanupMedia(
              before,
              referencedMediaIds(courseLevels, allCourseIds(createdCourses)),
            );
            return { createdCourses, goals, courseLevels };
          }
          const courseEdits = { ...state.courseEdits };
          delete courseEdits[courseId];
          if (state.removedCourseIds.includes(courseId)) return state;
          cleanupMedia(before, referencedMediaIds(courseLevels, ids));
          return {
            removedCourseIds: [...state.removedCourseIds, courseId],
            courseEdits,
            courseLevels,
          };
        }),
      restoreCourses: () => set({ removedCourseIds: [] }),
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
        return id;
      },
      setCourseLevels: (courseId, levels) =>
        set((state) => {
          const ids = allCourseIds(state.createdCourses);
          const before = referencedMediaIds(state.courseLevels, ids);
          const courseLevels = { ...state.courseLevels, [courseId]: levels };
          cleanupMedia(before, referencedMediaIds(courseLevels, ids));
          return { courseLevels };
        }),
      updateCourse: (courseId, draft) =>
        set((state) => {
          const created = state.createdCourses.find((c) => c.id === courseId);
          const sample = sampleCourses.find((c) => c.id === courseId);
          if (!created && (!sample || state.removedCourseIds.includes(courseId))) {
            throw new CourseNotFoundError();
          }
          if (created) {
            const edit = buildEdit(created, draft);
            return {
              createdCourses: state.createdCourses.map((c) =>
                c.id === courseId ? { ...c, ...edit } : c,
              ),
            };
          }
          const base: Course = { ...sample!, ...state.courseEdits[courseId] };
          return {
            courseEdits: {
              ...state.courseEdits,
              [courseId]: buildEdit(base, draft),
            },
          };
        }),
    }),
    {
      name: "membetter.learner",
      version: 1,
      partialize: (state): PersistedLearner => ({
        goals: state.goals,
        removedCourseIds: state.removedCourseIds,
        createdCourses: state.createdCourses,
        courseEdits: state.courseEdits,
        courseLevels: state.courseLevels,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PersistedLearner>;
        const createdCourses = (saved.createdCourses ?? []).filter(
          isValidCreatedCourse,
        );
        const knownIds = new Set([
          ...sampleIds,
          ...createdCourses.map((course) => course.id),
        ]);
        const goals: Record<string, GoalValue> = {};
        for (const [id, value] of Object.entries(saved.goals ?? {})) {
          if (knownIds.has(id) && GOAL_VALUES.includes(value)) goals[id] = value;
        }
        const removedCourseIds = (saved.removedCourseIds ?? []).filter((id) =>
          sampleIds.has(id),
        );
        const courseEdits: Record<string, CourseEdit> = {};
        for (const [id, edit] of Object.entries(saved.courseEdits ?? {})) {
          const languagesValid =
            (edit.teachingLanguageId === undefined ||
              getLanguageById(edit.teachingLanguageId) !== undefined) &&
            (edit.speakersLanguageId === undefined ||
              getLanguageById(edit.speakersLanguageId) !== undefined);
          if (sampleIds.has(id) && languagesValid) courseEdits[id] = edit;
        }
        const validIds = new Set([...sampleIds, ...createdCourses.map((c) => c.id)]);
        const courseLevels: Record<string, CourseLevel[]> = {};
        for (const [id, levels] of Object.entries(saved.courseLevels ?? {})) {
          const wellFormed =
            Array.isArray(levels) &&
            levels.every(
              (level) => Array.isArray(level.words) && typeof level.name === "string",
            );
          if (validIds.has(id) && wellFormed) courseLevels[id] = levels;
        }
        return {
          ...current,
          goals,
          removedCourseIds,
          createdCourses,
          courseEdits,
          courseLevels,
        };
      },
    },
  ),
);
