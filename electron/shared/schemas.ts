import { z } from "zod";

const text = (max: number) => z.string().max(max);

export const MediaRefSchema = z.object({
  id: z.string().min(1).max(200),
  name: z.string().max(300),
  type: z.string().max(100),
  size: z.number().int().min(0),
});

export const WordSchema = z.object({
  id: z.string().min(1).max(100),
  text: text(500),
  meaning: text(5000),
  example: text(5000),
  ipa: text(500).optional(),
  images: z.array(MediaRefSchema).max(5),
  audio: z.array(MediaRefSchema).max(5),
  learned: z.boolean(),
});

export const CourseLevelSchema = z.object({
  id: z.string().min(1).max(100),
  name: text(200),
  tested: text(500),
  words: z.array(WordSchema).max(5000),
});

const tags = z.array(z.string().min(1).max(30)).max(10);

export const CourseSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().trim().min(3).max(100),
  categoryId: z.string().min(1).max(100),
  coverImage: z.string().max(500).optional(),
  totalItems: z.number().int().min(0),
  itemsLearned: z.number().int().min(0),
  itemsDue: z.number().int().min(0),
  learnedToday: z.number().int().min(0),
  teaching: z.boolean(),
  teachingLanguageId: z.string().max(50).optional(),
  speakersLanguageId: z.string().max(50).optional(),
  tags: tags.optional(),
  description: text(2000).optional(),
  shortDescription: text(100).optional(),
});

export const CourseEditSchema = z.object({
  title: z.string().trim().min(3).max(100).optional(),
  teachingLanguageId: z.string().max(50).optional(),
  speakersLanguageId: z.string().max(50).optional(),
  tags: tags.optional(),
  description: text(2000).optional(),
  shortDescription: text(100).optional(),
  categoryId: z.string().max(100).optional(),
});

export const GoalSchema = z.union([z.literal(5), z.literal(10), z.literal(20), z.literal(50)]);

/** One persisted change to the learner's library. */
export const LibraryChangeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("upsertCourse"), course: CourseSchema }),
  z.object({ type: z.literal("deleteCourse"), courseId: z.string().min(1) }),
  z.object({ type: z.literal("setEdit"), courseId: z.string().min(1), edit: CourseEditSchema }),
  z.object({ type: z.literal("setGoal"), courseId: z.string().min(1), value: GoalSchema.nullable() }),
  z.object({ type: z.literal("hideCourse"), courseId: z.string().min(1) }),
  z.object({ type: z.literal("restoreHidden") }),
  z.object({ type: z.literal("saveLevels"), courseId: z.string().min(1), levels: z.array(CourseLevelSchema).max(500) }),
]);

export type MediaRefData = z.infer<typeof MediaRefSchema>;
export type WordData = z.infer<typeof WordSchema>;
export type CourseLevelData = z.infer<typeof CourseLevelSchema>;
export type CourseData = z.infer<typeof CourseSchema>;
export type CourseEditData = z.infer<typeof CourseEditSchema>;
export type LibraryChange = z.infer<typeof LibraryChangeSchema>;

export interface LibrarySnapshot {
  createdCourses: CourseData[];
  courseEdits: Record<string, CourseEditData>;
  courseLevels: Record<string, CourseLevelData[]>;
  goals: Record<string, 5 | 10 | 20 | 50>;
  removedCourseIds: string[];
}

/** One course as exported: the course fields plus its levels and words. */
export const ExportItemSchema = z.object({
  course: CourseSchema,
  levels: z.array(CourseLevelSchema).max(500),
});
export type ExportItem = z.infer<typeof ExportItemSchema>;
export const ExportItemsSchema = z.object({
  items: z.array(ExportItemSchema).min(1).max(1000),
  /** Include the learner's study progress (default: content only). */
  includeProgress: z.boolean().optional(),
});

export const ImportChoiceSchema = z.object({
  token: z.string().min(1).max(100),
  choice: z.enum(["replace", "copy", "cancel"]),
  /** Also restore the progress stored in the file (only when the file has some). */
  includeProgress: z.boolean().optional(),
});
export type ImportChoice = z.infer<typeof ImportChoiceSchema>["choice"];

export interface ImportPreviewCourse {
  title: string;
  levels: number;
  words: number;
  media: number;
  /** A course with the same id already exists in the library. */
  conflict: boolean;
}
export interface ImportPreview {
  token: string;
  kind: "course" | "library";
  courses: ImportPreviewCourse[];
  /** The file also carries the exporter's study progress. */
  hasProgress: boolean;
  /** Media referenced by the file that it did not include. */
  missingMedia: number;
}
export interface ExportOutcome {
  saved: boolean;
  path?: string;
  courses: number;
  missingMedia: number;
}
export interface ImportOutcome {
  imported: number;
}

export const BackupConfigPatchSchema = z.object({
  enabled: z.boolean().optional(),
  folder: z.string().min(1).max(4096).optional(),
  intervalDays: z.union([z.literal(1), z.literal(3), z.literal(7)]).optional(),
  keep: z.number().int().min(1).max(100).optional(),
});
export const BackupIdSchema = z.object({ id: z.string().min(1).max(100) });
export type BackupConfigPatch = z.infer<typeof BackupConfigPatchSchema>;
