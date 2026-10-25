import { defineConfig, type Plugin } from "vite";
import { createMockApi } from "./server/mockApi";

function mockProjectsApi(): Plugin {
  return {
    name: "training-mock-projects-api",
    configureServer(server) {
      const api = createMockApi();
      server.middlewares.use((req, res, next) => {
        void api.handle(req, res, next);
      });
    },
    configurePreviewServer(server) {
      const api = createMockApi();
      server.middlewares.use((req, res, next) => {
        void api.handle(req, res, next);
      });
    },
  };
}
export default defineConfig({ plugins: [mockProjectsApi()] });
