import { createHashRouter } from "react-router-dom";
import { HomePage } from "./ui/HomePage";
import { InMemoryPage } from "./ui/InMemoryPage";
import { PerformanceTestingPage } from "./ui/PerformanceTestingPage";

export const router = createHashRouter([
  {
    index: true,
    element: <HomePage />,
  },
  {
    path: "in-memory",
    element: <InMemoryPage />,
  },
  {
    path: "performance-testing",
    element: <PerformanceTestingPage />,
  },
]);
