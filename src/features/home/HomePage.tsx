import { CreateCourseButton } from "./components/CreateCourseButton";
import { EmptyState } from "./components/EmptyState";
import { CourseCard } from "./components/CourseCard";
import { FilterMenu } from "./components/FilterMenu";
import { HomeErrorBoundary } from "./components/HomeErrorBoundary";
import { TopAppBar } from "./components/TopAppBar";
import { useHomeExtensions } from "./context/HomeExtensions";
import { useFilteredCourses } from "./hooks/useFilteredCourses";
import { useLearnerStore } from "./store/learnerStore";

export function HomePage() {
  const { hasCourses, courses, categories, filter, filterName, setFilter, goals } =
    useFilteredCourses();
  const { toolbar } = useHomeExtensions();
  const restoreCourses = useLearnerStore((state) => state.restoreCourses);

  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar />
      <main className="mx-auto max-w-4xl px-4 pb-12 pt-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-headline-medium text-on-surface">{filterName}</h1>
          {hasCourses && (
            <FilterMenu
              filter={filter}
              categories={categories}
              onChange={setFilter}
            />
          )}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {toolbar}
            <CreateCourseButton />
          </div>
        </div>
        <HomeErrorBoundary>
          {!hasCourses ? (
            <EmptyState
              message="You have no courses"
              actionLabel="Restore sample courses"
              onAction={restoreCourses}
            />
          ) : courses.length === 0 ? (
            <EmptyState
              message="No courses match this filter"
              actionLabel="Clear filter"
              onAction={() => setFilter("all")}
            />
          ) : (
            <ul className="flex flex-col gap-4">
              {courses.map((course) => (
                <li key={course.id}>
                  <CourseCard course={course} goal={goals[course.id]} />
                </li>
              ))}
            </ul>
          )}
        </HomeErrorBoundary>
      </main>
    </div>
  );
}
