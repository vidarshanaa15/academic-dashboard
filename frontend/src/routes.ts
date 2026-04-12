import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Overview } from "./pages/Overview";
import { Goals } from "./pages/Goals";
import { Semesters } from "./pages/Semesters";
import { Calculator } from "./pages/Calculator";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Overview },
      { path: "goals", Component: Goals },
      { path: "semesters", Component: Semesters },
      { path: "calculator", Component: Calculator },
    ],
  },
]);
