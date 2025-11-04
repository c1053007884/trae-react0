import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/", () => import("./routes/home.tsx")),
  route("geo3d", () => import("./routes/geo3d.tsx"))
] satisfies RouteConfig;
