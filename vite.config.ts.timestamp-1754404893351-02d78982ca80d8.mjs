// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import fs from "fs";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode }) => {
  const plugins = [react()];
  if (mode === "development") {
    plugins.push(componentTagger());
  }
  return {
    server: {
      host: "::",
      port: 8080
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src"),
        react: path.resolve(__vite_injected_original_dirname, "./node_modules/react"),
        "react-dom": path.resolve(__vite_injected_original_dirname, "./node_modules/react-dom")
      },
      dedupe: ["react", "react-dom"]
    },
    build: {
      target: "es2020",
      rollupOptions: {
        output: {
          manualChunks: () => "everything",
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]"
        },
        external: [],
        onwarn(warning, warn) {
          const timestamp = (/* @__PURE__ */ new Date()).toISOString();
          const isAppCode = warning.id && !warning.id.includes("node_modules");
          const criticalWarnings = [
            "MISSING_EXPORT",
            "UNRESOLVED_IMPORT",
            "EMPTY_BUNDLE",
            "PLUGIN_ERROR"
          ];
          const isCritical = criticalWarnings.includes(warning.code);
          if (isAppCode || isCritical) {
            const logEntry = `${timestamp} - ${warning.code}: ${warning.message}
`;
            fs.appendFileSync("build-warnings.log", logEntry);
            console.log("\u{1F6A8} CODE WARNING:", warning.code, warning.message);
            if (warning.id) console.log("   \u{1F4C1}", warning.id);
            warn(warning);
          }
        }
      },
      chunkSizeWarningLimit: 5e3,
      minify: "esbuild",
      sourcemap: mode === "development",
      ...mode === "production" && {
        esbuild: {
          drop: ["console", "debugger"],
          legalComments: "none"
        }
      }
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "react-router-dom",
        "lucide-react",
        "@tanstack/react-query",
        "clsx",
        "tailwind-merge"
      ],
      dedupe: ["react", "react-dom"],
      force: true
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICBjb25zdCBwbHVnaW5zID0gW3JlYWN0KCldO1xuXG4gIGlmIChtb2RlID09PSBcImRldmVsb3BtZW50XCIpIHtcbiAgICBwbHVnaW5zLnB1c2goY29tcG9uZW50VGFnZ2VyKCkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IFwiOjpcIixcbiAgICAgIHBvcnQ6IDgwODAsXG4gICAgfSxcbiAgICBwbHVnaW5zLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgICByZWFjdDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL25vZGVfbW9kdWxlcy9yZWFjdFwiKSxcbiAgICAgICAgXCJyZWFjdC1kb21cIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL25vZGVfbW9kdWxlcy9yZWFjdC1kb21cIiksXG4gICAgICB9LFxuICAgICAgZGVkdXBlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICB0YXJnZXQ6IFwiZXMyMDIwXCIsXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rczogKCkgPT4gXCJldmVyeXRoaW5nXCIsXG4gICAgICAgICAgZW50cnlGaWxlTmFtZXM6IFwiYXNzZXRzL1tuYW1lXS5qc1wiLFxuICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiBcImFzc2V0cy9bbmFtZV0uanNcIixcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogXCJhc3NldHMvW25hbWVdLltleHRdXCIsXG4gICAgICAgIH0sXG4gICAgICAgIGV4dGVybmFsOiBbXSxcbiAgICAgICAgb253YXJuKHdhcm5pbmcsIHdhcm4pIHtcbiAgICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgICAgY29uc3QgaXNBcHBDb2RlID1cbiAgICAgICAgICAgIHdhcm5pbmcuaWQgJiYgIXdhcm5pbmcuaWQuaW5jbHVkZXMoXCJub2RlX21vZHVsZXNcIik7XG4gICAgICAgICAgY29uc3QgY3JpdGljYWxXYXJuaW5ncyA9IFtcbiAgICAgICAgICAgIFwiTUlTU0lOR19FWFBPUlRcIixcbiAgICAgICAgICAgIFwiVU5SRVNPTFZFRF9JTVBPUlRcIixcbiAgICAgICAgICAgIFwiRU1QVFlfQlVORExFXCIsXG4gICAgICAgICAgICBcIlBMVUdJTl9FUlJPUlwiLFxuICAgICAgICAgIF07XG4gICAgICAgICAgY29uc3QgaXNDcml0aWNhbCA9IGNyaXRpY2FsV2FybmluZ3MuaW5jbHVkZXMod2FybmluZy5jb2RlKTtcblxuICAgICAgICAgIGlmIChpc0FwcENvZGUgfHwgaXNDcml0aWNhbCkge1xuICAgICAgICAgICAgY29uc3QgbG9nRW50cnkgPSBgJHt0aW1lc3RhbXB9IC0gJHt3YXJuaW5nLmNvZGV9OiAke3dhcm5pbmcubWVzc2FnZX1cXG5gO1xuICAgICAgICAgICAgZnMuYXBwZW5kRmlsZVN5bmMoXCJidWlsZC13YXJuaW5ncy5sb2dcIiwgbG9nRW50cnkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJcdUQ4M0RcdURFQTggQ09ERSBXQVJOSU5HOlwiLCB3YXJuaW5nLmNvZGUsIHdhcm5pbmcubWVzc2FnZSk7XG4gICAgICAgICAgICBpZiAod2FybmluZy5pZCkgY29uc29sZS5sb2coXCIgICBcdUQ4M0RcdURDQzFcIiwgd2FybmluZy5pZCk7XG4gICAgICAgICAgICB3YXJuKHdhcm5pbmcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDUwMDAsXG4gICAgICBtaW5pZnk6IFwiZXNidWlsZFwiLFxuICAgICAgc291cmNlbWFwOiBtb2RlID09PSBcImRldmVsb3BtZW50XCIsXG4gICAgICAuLi4obW9kZSA9PT0gXCJwcm9kdWN0aW9uXCIgJiYge1xuICAgICAgICBlc2J1aWxkOiB7XG4gICAgICAgICAgZHJvcDogW1wiY29uc29sZVwiLCBcImRlYnVnZ2VyXCJdLFxuICAgICAgICAgIGxlZ2FsQ29tbWVudHM6IFwibm9uZVwiLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgfSxcbiAgICBvcHRpbWl6ZURlcHM6IHtcbiAgICAgIGluY2x1ZGU6IFtcbiAgICAgICAgXCJyZWFjdFwiLFxuICAgICAgICBcInJlYWN0LWRvbVwiLFxuICAgICAgICBcInJlYWN0L2pzeC1ydW50aW1lXCIsXG4gICAgICAgIFwicmVhY3QvanN4LWRldi1ydW50aW1lXCIsXG4gICAgICAgIFwicmVhY3Qtcm91dGVyLWRvbVwiLFxuICAgICAgICBcImx1Y2lkZS1yZWFjdFwiLFxuICAgICAgICBcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiLFxuICAgICAgICBcImNsc3hcIixcbiAgICAgICAgXCJ0YWlsd2luZC1tZXJnZVwiLFxuICAgICAgXSxcbiAgICAgIGRlZHVwZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIl0sXG4gICAgICBmb3JjZTogdHJ1ZSxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsT0FBTyxRQUFRO0FBQ2YsU0FBUyx1QkFBdUI7QUFKaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE1BQU07QUFDeEMsUUFBTSxVQUFVLENBQUMsTUFBTSxDQUFDO0FBRXhCLE1BQUksU0FBUyxlQUFlO0FBQzFCLFlBQVEsS0FBSyxnQkFBZ0IsQ0FBQztBQUFBLEVBQ2hDO0FBRUEsU0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLElBQ1I7QUFBQSxJQUNBO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsUUFDcEMsT0FBTyxLQUFLLFFBQVEsa0NBQVcsc0JBQXNCO0FBQUEsUUFDckQsYUFBYSxLQUFLLFFBQVEsa0NBQVcsMEJBQTBCO0FBQUEsTUFDakU7QUFBQSxNQUNBLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxJQUMvQjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sY0FBYyxNQUFNO0FBQUEsVUFDcEIsZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsUUFDbEI7QUFBQSxRQUNBLFVBQVUsQ0FBQztBQUFBLFFBQ1gsT0FBTyxTQUFTLE1BQU07QUFDcEIsZ0JBQU0sYUFBWSxvQkFBSSxLQUFLLEdBQUUsWUFBWTtBQUN6QyxnQkFBTSxZQUNKLFFBQVEsTUFBTSxDQUFDLFFBQVEsR0FBRyxTQUFTLGNBQWM7QUFDbkQsZ0JBQU0sbUJBQW1CO0FBQUEsWUFDdkI7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQ0EsZ0JBQU0sYUFBYSxpQkFBaUIsU0FBUyxRQUFRLElBQUk7QUFFekQsY0FBSSxhQUFhLFlBQVk7QUFDM0Isa0JBQU0sV0FBVyxHQUFHLFNBQVMsTUFBTSxRQUFRLElBQUksS0FBSyxRQUFRLE9BQU87QUFBQTtBQUNuRSxlQUFHLGVBQWUsc0JBQXNCLFFBQVE7QUFDaEQsb0JBQVEsSUFBSSwyQkFBb0IsUUFBUSxNQUFNLFFBQVEsT0FBTztBQUM3RCxnQkFBSSxRQUFRLEdBQUksU0FBUSxJQUFJLGdCQUFTLFFBQVEsRUFBRTtBQUMvQyxpQkFBSyxPQUFPO0FBQUEsVUFDZDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsTUFDQSx1QkFBdUI7QUFBQSxNQUN2QixRQUFRO0FBQUEsTUFDUixXQUFXLFNBQVM7QUFBQSxNQUNwQixHQUFJLFNBQVMsZ0JBQWdCO0FBQUEsUUFDM0IsU0FBUztBQUFBLFVBQ1AsTUFBTSxDQUFDLFdBQVcsVUFBVTtBQUFBLFVBQzVCLGVBQWU7QUFBQSxRQUNqQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxjQUFjO0FBQUEsTUFDWixTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLE1BQzdCLE9BQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
