import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sampleCourses } from "../data/sampleCourses";
import { GOAL_VALUES, type GoalValue } from "../model/types";

interface LearnerState {
  goals: Record<string, GoalValue>;
  removedCourseIds: string[];
  setGoal: (courseId: string, value: GoalValue | null) => void;
  removeCourse: (courseId: string) => void;
  restoreCourses: () => void;
}

type PersistedLearner = Pick<LearnerState, "goals" | "removedCourseIds">;

const knownIds = new Set(sampleCourses.map((course) => course.id));

export const useLearnerStore = create<LearnerState>()(
  persist(
    (set) => ({
      goals: {},
      removedCourseIds: [],
      setGoal: (courseId, value) =>
        set((state) => {
          const goals = { ...state.goals };
          if (value === null) delete goals[courseId];
          else goals[courseId] = value;
          return { goals };
        }),
      removeCourse: (courseId) =>
        set((state) =>
          state.removedCourseIds.includes(courseId)
            ? state
            : { removedCourseIds: [...state.removedCourseIds, courseId] },
        ),
      restoreCourses: () => set({ removedCourseIds: [] }),
    }),
    {
      name: "membetter.learner",
      version: 1,
      partialize: (state): PersistedLearner => ({
        goals: state.goals,
        removedCourseIds: state.removedCourseIds,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<PersistedLearner>;
        const goals: Record<string, GoalValue> = {};
        for (const [id, value] of Object.entries(saved.goals ?? {})) {
          if (knownIds.has(id) && GOAL_VALUES.includes(value)) goals[id] = value;
        }
        const removedCourseIds = (saved.removedCourseIds ?? []).filter((id) =>
          knownIds.has(id),
        );
        return { ...current, goals, removedCourseIds };
      },
    },
  ),
);
