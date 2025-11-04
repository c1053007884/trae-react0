import type { RouteConfig } from "@react-router/dev/routes";
import { route, index } from "@react-router/dev/routes";

export default [
  index("./routes/home.tsx"),
  route("geo3d", "./routes/geo3d.tsx"),
] satisfies RouteConfig;
