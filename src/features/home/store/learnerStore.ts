import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getLanguageById } from "../data/languages";
import { sampleCourses } from "../data/sampleCourses";
import { parseTags } from "../model/tags";
import {
  GOAL_VALUES,
  type Course,
  type CourseDraft,
  type GoalValue,
} from "../model/types";

interface LearnerState {
  goals: Record<string, GoalValue>;
  removedCourseIds: string[];
  createdCourses: Course[];
  setGoal: (courseId: string, value: GoalValue | null) => void;
  removeCourse: (courseId: string) => void;
  restoreCourses: () => void;
  addCourse: (draft: CourseDraft) => string;
}

type PersistedLearner = Pick<
  LearnerState,
  "goals" | "removedCourseIds" | "createdCourses"
>;

const sampleIds = new Set(sampleCourses.map((course) => course.id));

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
          return state.removedCourseIds.includes(courseId)
            ? state
            : { removedCourseIds: [...state.removedCourseIds, courseId] };
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
    }),
    {
      name: "membetter.learner",
      version: 1,
      partialize: (state): PersistedLearner => ({
        goals: state.goals,
        removedCourseIds: state.removedCourseIds,
        createdCourses: state.createdCourses,
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
        return { ...current, goals, removedCourseIds, createdCourses };
      },
    },
  ),
);
