import { createBrowserRouter } from "react-router";
import { HomePage } from "../features/home";

export const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
]);
