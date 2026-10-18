import { Navigate, createBrowserRouter } from "react-router";
import { HomePage } from "../features/home";
import { CourseDetailPage, LevelPlaceholder } from "../features/course-detail";
import { CreateCoursePage } from "../features/create-course";
import { CourseEditorPage } from "../features/course-editor";
import { ComingSoonPage, CoursePlaceholder } from "../features/placeholder";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/courses", element: <ComingSoonPage title="Courses" /> },
  { path: "/courses/new", element: <CreateCoursePage /> },
  {
    path: "/help/course-creation",
    element: <ComingSoonPage title="Course Creation knowledge base" />,
  },
  { path: "/groups", element: <ComingSoonPage title="Groups" /> },
  { path: "/profile", element: <ComingSoonPage title="Profile" /> },
  { path: "/course/:id", element: <CourseDetailPage /> },
  {
    path: "/course/:id/review",
    element: <CoursePlaceholder title="Review" />,
  },
  {
    path: "/course/:id/speed-review",
    element: <CoursePlaceholder title="Speed review" />,
  },
  {
    path: "/course/:id/learn",
    element: <CoursePlaceholder title="Learn new words" />,
  },
  { path: "/course/:id/share", element: <CoursePlaceholder title="Tweet" /> },
  { path: "/course/:id/edit", element: <CourseEditorPage tab="levels" /> },
  { path: "/course/:id/edit/details", element: <CourseEditorPage tab="details" /> },
  { path: "/course/:id/edit/databases", element: <CourseEditorPage tab="databases" /> },
  { path: "/course/:id/edit/contributors", element: <CourseEditorPage tab="contributors" /> },
  {
    path: "/course/:id/leaderboard",
    element: <CoursePlaceholder title="Leaderboard" />,
  },
  { path: "/course/:id/levels/:level", element: <LevelPlaceholder /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
