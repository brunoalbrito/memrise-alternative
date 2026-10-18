import type Database from "better-sqlite3";
import type {
  CourseData,
  CourseEditData,
  CourseLevelData,
  LibraryChange,
  LibrarySnapshot,
  WordData,
} from "../shared/schemas";

const TRASH_DAYS = 30;

type Db = Database.Database;

interface CourseRow {
  id: string;
  title: string;
  category_id: string;
  cover_image: string | null;
  teaching: number;
  total_items: number;
  items_learned: number;
  items_due: number;
  learned_today: number;
  teaching_language_id: string | null;
  speakers_language_id: string | null;
  tags: string | null;
  description: string | null;
  short_description: string | null;
}

interface WordRow {
  level_id: string;
  id: string;
  text: string;
  meaning: string;
  example: string;
  ipa: string | null;
  learned: number;
  images: string;
  audio: string;
}

function courseFromRow(row: CourseRow): CourseData {
  const course: CourseData = {
    id: row.id,
    title: row.title,
    categoryId: row.category_id,
    totalItems: row.total_items,
    itemsLearned: row.items_learned,
    itemsDue: row.items_due,
    learnedToday: row.learned_today,
    teaching: row.teaching === 1,
  };
  if (row.cover_image !== null) course.coverImage = row.cover_image;
  if (row.teaching_language_id !== null) course.teachingLanguageId = row.teaching_language_id;
  if (row.speakers_language_id !== null) course.speakersLanguageId = row.speakers_language_id;
  if (row.tags !== null) course.tags = JSON.parse(row.tags) as string[];
  if (row.description !== null) course.description = row.description;
  if (row.short_description !== null) course.shortDescription = row.short_description;
  return course;
}

/** Reads everything the learner has stored, in the shape the app state uses. */
export function loadLibrary(db: Db): LibrarySnapshot {
  const createdCourses = (
    db.prepare("SELECT * FROM courses WHERE deleted_at IS NULL ORDER BY created_at, rowid").all() as CourseRow[]
  ).map(courseFromRow);

  const courseEdits: Record<string, CourseEditData> = {};
  for (const row of db.prepare("SELECT course_id, edit FROM course_edits").all() as { course_id: string; edit: string }[]) {
    courseEdits[row.course_id] = JSON.parse(row.edit) as CourseEditData;
  }

  const goals: LibrarySnapshot["goals"] = {};
  const removedCourseIds: string[] = [];
  for (const row of db.prepare("SELECT course_id, daily_goal, hidden_at FROM course_settings").all() as {
    course_id: string;
    daily_goal: 5 | 10 | 20 | 50 | null;
    hidden_at: string | null;
  }[]) {
    if (row.daily_goal !== null) goals[row.course_id] = row.daily_goal;
    if (row.hidden_at !== null) removedCourseIds.push(row.course_id);
  }

  const wordsByLevel = new Map<string, WordData[]>();
  for (const w of db.prepare("SELECT * FROM words ORDER BY level_id, position").all() as WordRow[]) {
    const word: WordData = {
      id: w.id,
      text: w.text,
      meaning: w.meaning,
      example: w.example,
      images: JSON.parse(w.images) as WordData["images"],
      audio: JSON.parse(w.audio) as WordData["audio"],
      learned: w.learned === 1,
    };
    if (w.ipa !== null) word.ipa = w.ipa;
    const list = wordsByLevel.get(w.level_id) ?? [];
    list.push(word);
    wordsByLevel.set(w.level_id, list);
  }

  const courseLevels: Record<string, CourseLevelData[]> = {};
  for (const l of db.prepare("SELECT id, course_id, name, tested FROM levels ORDER BY course_id, position").all() as {
    id: string;
    course_id: string;
    name: string;
    tested: string;
  }[]) {
    (courseLevels[l.course_id] ??= []).push({
      id: l.id,
      name: l.name,
      tested: l.tested,
      words: wordsByLevel.get(l.id) ?? [],
    });
  }
  // A course that was saved with no levels still has an (empty) entry.
  for (const course of createdCourses) courseLevels[course.id] ??= [];

  return { createdCourses, courseEdits, courseLevels, goals, removedCourseIds };
}

function deleteLevelsOf(db: Db, courseId: string): void {
  db.prepare("DELETE FROM levels WHERE course_id = ?").run(courseId);
}

function saveLevels(db: Db, courseId: string, levels: CourseLevelData[]): void {
  const keep = new Set(levels.map((l) => l.id));
  const existing = db.prepare("SELECT id FROM levels WHERE course_id = ?").all(courseId) as { id: string }[];
  const dropLevel = db.prepare("DELETE FROM levels WHERE id = ?");
  for (const { id } of existing) if (!keep.has(id)) dropLevel.run(id);

  const upsertLevel = db.prepare(
    `INSERT INTO levels (id, course_id, position, name, tested) VALUES (@id, @courseId, @position, @name, @tested)
     ON CONFLICT (id) DO UPDATE SET course_id = @courseId, position = @position, name = @name, tested = @tested`,
  );
  const dropWord = db.prepare("DELETE FROM words WHERE level_id = ? AND id = ?");
  const upsertWord = db.prepare(
    `INSERT INTO words (level_id, id, position, text, meaning, example, ipa, learned, images, audio)
     VALUES (@levelId, @id, @position, @text, @meaning, @example, @ipa, @learned, @images, @audio)
     ON CONFLICT (level_id, id) DO UPDATE SET position = @position, text = @text, meaning = @meaning,
       example = @example, ipa = @ipa, learned = @learned, images = @images, audio = @audio`,
  );

  levels.forEach((level, position) => {
    upsertLevel.run({ id: level.id, courseId, position, name: level.name, tested: level.tested });
    const wordIds = new Set(level.words.map((w) => w.id));
    const current = db.prepare("SELECT id FROM words WHERE level_id = ?").all(level.id) as { id: string }[];
    for (const { id } of current) if (!wordIds.has(id)) dropWord.run(level.id, id);
    level.words.forEach((word, wordPosition) => {
      upsertWord.run({
        levelId: level.id,
        id: word.id,
        position: wordPosition,
        text: word.text,
        meaning: word.meaning,
        example: word.example,
        ipa: word.ipa ?? null,
        learned: word.learned ? 1 : 0,
        images: JSON.stringify(word.images),
        audio: JSON.stringify(word.audio),
      });
    });
  });
}

function upsertCourse(db: Db, course: CourseData, now: string): void {
  db.prepare(
    `INSERT INTO courses (id, title, category_id, cover_image, teaching, total_items, items_learned, items_due,
       learned_today, teaching_language_id, speakers_language_id, tags, description, short_description, created_at, updated_at)
     VALUES (@id, @title, @categoryId, @coverImage, @teaching, @totalItems, @itemsLearned, @itemsDue, @learnedToday,
       @teachingLanguageId, @speakersLanguageId, @tags, @description, @shortDescription, @now, @now)
     ON CONFLICT (id) DO UPDATE SET title = @title, category_id = @categoryId, cover_image = @coverImage,
       teaching = @teaching, total_items = @totalItems, items_learned = @itemsLearned, items_due = @itemsDue,
       learned_today = @learnedToday, teaching_language_id = @teachingLanguageId,
       speakers_language_id = @speakersLanguageId, tags = @tags, description = @description,
       short_description = @shortDescription, updated_at = @now, deleted_at = NULL`,
  ).run({
    id: course.id,
    title: course.title,
    categoryId: course.categoryId,
    coverImage: course.coverImage ?? null,
    teaching: course.teaching ? 1 : 0,
    totalItems: course.totalItems,
    itemsLearned: course.itemsLearned,
    itemsDue: course.itemsDue,
    learnedToday: course.learnedToday,
    teachingLanguageId: course.teachingLanguageId ?? null,
    speakersLanguageId: course.speakersLanguageId ?? null,
    tags: course.tags ? JSON.stringify(course.tags) : null,
    description: course.description ?? null,
    shortDescription: course.shortDescription ?? null,
    now,
  });
}

/** Applies one change atomically. */
export function applyChange(db: Db, change: LibraryChange, now: () => Date = () => new Date()): void {
  const stamp = now().toISOString();
  db.transaction(() => {
    switch (change.type) {
      case "upsertCourse":
        upsertCourse(db, change.course, stamp);
        break;
      case "deleteCourse":
        // Soft delete: kept in the trash for 30 days.
        db.prepare("UPDATE courses SET deleted_at = ? WHERE id = ?").run(stamp, change.courseId);
        db.prepare("DELETE FROM course_settings WHERE course_id = ?").run(change.courseId);
        break;
      case "setEdit":
        db.prepare(
          "INSERT INTO course_edits (course_id, edit) VALUES (?, ?) ON CONFLICT (course_id) DO UPDATE SET edit = excluded.edit",
        ).run(change.courseId, JSON.stringify(change.edit));
        break;
      case "setGoal":
        db.prepare(
          `INSERT INTO course_settings (course_id, daily_goal) VALUES (?, ?)
           ON CONFLICT (course_id) DO UPDATE SET daily_goal = excluded.daily_goal`,
        ).run(change.courseId, change.value);
        break;
      case "hideCourse":
        db.prepare(
          `INSERT INTO course_settings (course_id, hidden_at) VALUES (?, ?)
           ON CONFLICT (course_id) DO UPDATE SET hidden_at = excluded.hidden_at`,
        ).run(change.courseId, stamp);
        // Hiding a sample also drops the learner's edits to it, as before.
        db.prepare("DELETE FROM course_edits WHERE course_id = ?").run(change.courseId);
        deleteLevelsOf(db, change.courseId);
        break;
      case "restoreHidden":
        db.prepare("UPDATE course_settings SET hidden_at = NULL").run();
        break;
      case "saveLevels":
        saveLevels(db, change.courseId, change.levels);
        break;
    }
  })();
}

/** Permanently removes courses that have been in the trash longer than 30 days. */
export function purgeTrash(db: Db, now: () => Date = () => new Date()): number {
  const cutoff = new Date(now().getTime() - TRASH_DAYS * 86_400_000).toISOString();
  const old = db.prepare("SELECT id FROM courses WHERE deleted_at IS NOT NULL AND deleted_at < ?").all(cutoff) as {
    id: string;
  }[];
  db.transaction(() => {
    for (const { id } of old) {
      deleteLevelsOf(db, id);
      db.prepare("DELETE FROM courses WHERE id = ?").run(id);
    }
  })();
  return old.length;
}
