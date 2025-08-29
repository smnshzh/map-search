import { onRequest as ___worker_js_onRequest } from "D:\\cloned\\map-nextjs\\functions\\_worker.js"
import { onRequest as __neighborhood_js_onRequest } from "D:\\cloned\\map-nextjs\\functions\\neighborhood.js"

export const routes = [
    {
      routePath: "/_worker",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [___worker_js_onRequest],
    },
  {
      routePath: "/neighborhood",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__neighborhood_js_onRequest],
    },
  ]