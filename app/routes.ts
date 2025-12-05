import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("browser", "routes/browser.tsx"),
  route("add-note", "routes/add-note.tsx"),
  route("study", "routes/study.tsx"),
] satisfies RouteConfig;
