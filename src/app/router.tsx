import { Navigate, createBrowserRouter } from "react-router";
import { HomePage } from "../features/home";
import { CreateCoursePage } from "../features/create-course";
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
  {
    path: "/course/:id/review",
    element: <CoursePlaceholder title="Speed review" />,
  },
  {
    path: "/course/:id/learn",
    element: <CoursePlaceholder title="Learn new words" />,
  },
  {
    path: "/course/:id/levels",
    element: <CoursePlaceholder title="Levels and items" />,
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
