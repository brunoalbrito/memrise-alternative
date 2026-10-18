import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getLanguageById } from "../data/languages";
import { sampleCourses } from "../data/sampleCourses";
import { parseTags } from "../model/tags";
import {
  GOAL_VALUES,
  type Course,
  type CourseDraft,
  type CourseEdit,
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
  setGoal: (courseId: string, value: GoalValue | null) => void;
  removeCourse: (courseId: string) => void;
  restoreCourses: () => void;
  addCourse: (draft: CourseDraft) => string;
  updateCourse: (courseId: string, draft: CourseDraft) => void;
}

type PersistedLearner = Pick<
  LearnerState,
  "goals" | "removedCourseIds" | "createdCourses" | "courseEdits"
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
      setGoal: (courseId, value) =>
        set((state) => {
          const goals = { ...state.goals };
          if (value === null) delete goals[courseId];
          else goals[courseId] = value;
          return { goals };
        }),
      removeCourse: (courseId) =>
        set((state) => {
          if (state.createdCourses.some((course) => course.id === courseId)) {
            const goals = { ...state.goals };
            delete goals[courseId];
            return {
              createdCourses: state.createdCourses.filter(
                (course) => course.id !== courseId,
              ),
              goals,
            };
          }
          const courseEdits = { ...state.courseEdits };
          delete courseEdits[courseId];
          return state.removedCourseIds.includes(courseId)
            ? state
            : {
                removedCourseIds: [...state.removedCourseIds, courseId],
                courseEdits,
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
        set((state) => ({ createdCourses: [...state.createdCourses, course] }));
        return id;
      },
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
        return { ...current, goals, removedCourseIds, createdCourses, courseEdits };
      },
    },
  ),
);
