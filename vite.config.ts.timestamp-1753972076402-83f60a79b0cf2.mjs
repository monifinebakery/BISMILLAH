// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import fs from "fs";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode, command }) => {
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
        "react": path.resolve(__vite_injected_original_dirname, "./node_modules/react"),
        "react-dom": path.resolve(__vite_injected_original_dirname, "./node_modules/react-dom")
      },
      dedupe: ["react", "react-dom"]
    },
    build: {
      target: "es2020",
      rollupOptions: {
        // ✅ EMERGENCY: NO CHUNKING AT ALL
        output: {
          manualChunks: void 0
          // Disable all manual chunking
        },
        // ✅ ULTRA CLEAN: Only show YOUR code warnings
        onwarn(warning, warn) {
          const timestamp = (/* @__PURE__ */ new Date()).toISOString();
          const isAppCode = warning.id && !warning.id.includes("node_modules");
          const criticalWarnings = ["MISSING_EXPORT", "UNRESOLVED_IMPORT", "EMPTY_BUNDLE", "PLUGIN_ERROR"];
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
      // ✅ Increase chunk size limit - single bundle will be larger
      chunkSizeWarningLimit: 3e3,
      minify: "esbuild",
      sourcemap: mode === "development",
      // ✅ Production optimizations
      ...mode === "production" && {
        esbuild: {
          drop: ["console", "debugger"],
          legalComments: "none"
        }
      }
    },
    // ✅ Enhanced dependency optimization - force React bundling
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUsIGNvbW1hbmQgfSkgPT4ge1xuICBjb25zdCBwbHVnaW5zID0gW3JlYWN0KCldO1xuICBcbiAgaWYgKG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIikge1xuICAgIHBsdWdpbnMucHVzaChjb21wb25lbnRUYWdnZXIoKSk7XG4gIH1cbiAgXG4gIHJldHVybiB7XG4gICAgc2VydmVyOiB7XG4gICAgICBob3N0OiBcIjo6XCIsXG4gICAgICBwb3J0OiA4MDgwLFxuICAgIH0sXG4gICAgcGx1Z2lucyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgICAgXCJyZWFjdFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0XCIpLFxuICAgICAgICBcInJlYWN0LWRvbVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0LWRvbVwiKSxcbiAgICAgIH0sXG4gICAgICBkZWR1cGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCJdLFxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIHRhcmdldDogJ2VzMjAyMCcsXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIC8vIFx1MjcwNSBFTUVSR0VOQ1k6IE5PIENIVU5LSU5HIEFUIEFMTFxuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHVuZGVmaW5lZCwgLy8gRGlzYWJsZSBhbGwgbWFudWFsIGNodW5raW5nXG4gICAgICAgIH0sXG4gICAgICAgIFxuICAgICAgICAvLyBcdTI3MDUgVUxUUkEgQ0xFQU46IE9ubHkgc2hvdyBZT1VSIGNvZGUgd2FybmluZ3NcbiAgICAgICAgb253YXJuKHdhcm5pbmcsIHdhcm4pIHtcbiAgICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gXHUyNzA1IE9ubHkgY2FyZSBhYm91dCBhcHAgY29kZSB3YXJuaW5nc1xuICAgICAgICAgIGNvbnN0IGlzQXBwQ29kZSA9IHdhcm5pbmcuaWQgJiYgIXdhcm5pbmcuaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpO1xuICAgICAgICAgIGNvbnN0IGNyaXRpY2FsV2FybmluZ3MgPSBbJ01JU1NJTkdfRVhQT1JUJywgJ1VOUkVTT0xWRURfSU1QT1JUJywgJ0VNUFRZX0JVTkRMRScsICdQTFVHSU5fRVJST1InXTtcbiAgICAgICAgICBjb25zdCBpc0NyaXRpY2FsID0gY3JpdGljYWxXYXJuaW5ncy5pbmNsdWRlcyh3YXJuaW5nLmNvZGUpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIFx1MjcwNSBPbmx5IGxvZyBhbmQgc2hvdyB3YXJuaW5ncyBmcm9tIFlPVVIgY29kZVxuICAgICAgICAgIGlmIChpc0FwcENvZGUgfHwgaXNDcml0aWNhbCkge1xuICAgICAgICAgICAgY29uc3QgbG9nRW50cnkgPSBgJHt0aW1lc3RhbXB9IC0gJHt3YXJuaW5nLmNvZGV9OiAke3dhcm5pbmcubWVzc2FnZX1cXG5gO1xuICAgICAgICAgICAgZnMuYXBwZW5kRmlsZVN5bmMoJ2J1aWxkLXdhcm5pbmdzLmxvZycsIGxvZ0VudHJ5KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1x1RDgzRFx1REVBOCBDT0RFIFdBUk5JTkc6Jywgd2FybmluZy5jb2RlLCB3YXJuaW5nLm1lc3NhZ2UpO1xuICAgICAgICAgICAgaWYgKHdhcm5pbmcuaWQpIGNvbnNvbGUubG9nKCcgICBcdUQ4M0RcdURDQzEnLCB3YXJuaW5nLmlkKTtcbiAgICAgICAgICAgIHdhcm4od2FybmluZyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIC8vIFx1MjcwNSBBbGwgbGlicmFyeSB3YXJuaW5ncyBhcmUgY29tcGxldGVseSBpZ25vcmVkXG4gICAgICAgICAgLy8gTm8gY29uc29sZSBzcGFtLCBubyBidWlsZCBvdXRwdXQgc3BhbVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBcdTI3MDUgSW5jcmVhc2UgY2h1bmsgc2l6ZSBsaW1pdCAtIHNpbmdsZSBidW5kbGUgd2lsbCBiZSBsYXJnZXJcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMzAwMCxcbiAgICAgIFxuICAgICAgbWluaWZ5OiAnZXNidWlsZCcsXG4gICAgICBzb3VyY2VtYXA6IG1vZGUgPT09ICdkZXZlbG9wbWVudCcsXG4gICAgICBcbiAgICAgIC8vIFx1MjcwNSBQcm9kdWN0aW9uIG9wdGltaXphdGlvbnNcbiAgICAgIC4uLihtb2RlID09PSAncHJvZHVjdGlvbicgJiYge1xuICAgICAgICBlc2J1aWxkOiB7XG4gICAgICAgICAgZHJvcDogWydjb25zb2xlJywgJ2RlYnVnZ2VyJ10sXG4gICAgICAgICAgbGVnYWxDb21tZW50czogJ25vbmUnXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSxcbiAgICBcbiAgICAvLyBcdTI3MDUgRW5oYW5jZWQgZGVwZW5kZW5jeSBvcHRpbWl6YXRpb24gLSBmb3JjZSBSZWFjdCBidW5kbGluZ1xuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgaW5jbHVkZTogW1xuICAgICAgICBcInJlYWN0XCIsIFxuICAgICAgICBcInJlYWN0LWRvbVwiLCBcbiAgICAgICAgXCJyZWFjdC9qc3gtcnVudGltZVwiLFxuICAgICAgICBcInJlYWN0L2pzeC1kZXYtcnVudGltZVwiLFxuICAgICAgICBcInJlYWN0LXJvdXRlci1kb21cIixcbiAgICAgICAgXCJsdWNpZGUtcmVhY3RcIixcbiAgICAgICAgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIixcbiAgICAgICAgXCJjbHN4XCIsXG4gICAgICAgIFwidGFpbHdpbmQtbWVyZ2VcIlxuICAgICAgXSxcbiAgICAgIGRlZHVwZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIl0sXG4gICAgICBmb3JjZTogdHJ1ZVxuICAgIH1cbiAgfTtcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFDZixTQUFTLHVCQUF1QjtBQUpoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLE1BQU0sUUFBUSxNQUFNO0FBQ2pELFFBQU0sVUFBVSxDQUFDLE1BQU0sQ0FBQztBQUV4QixNQUFJLFNBQVMsZUFBZTtBQUMxQixZQUFRLEtBQUssZ0JBQWdCLENBQUM7QUFBQSxFQUNoQztBQUVBLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxJQUNSO0FBQUEsSUFDQTtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLFFBQ3BDLFNBQVMsS0FBSyxRQUFRLGtDQUFXLHNCQUFzQjtBQUFBLFFBQ3ZELGFBQWEsS0FBSyxRQUFRLGtDQUFXLDBCQUEwQjtBQUFBLE1BQ2pFO0FBQUEsTUFDQSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsSUFDL0I7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLGVBQWU7QUFBQTtBQUFBLFFBRWIsUUFBUTtBQUFBLFVBQ04sY0FBYztBQUFBO0FBQUEsUUFDaEI7QUFBQTtBQUFBLFFBR0EsT0FBTyxTQUFTLE1BQU07QUFDcEIsZ0JBQU0sYUFBWSxvQkFBSSxLQUFLLEdBQUUsWUFBWTtBQUd6QyxnQkFBTSxZQUFZLFFBQVEsTUFBTSxDQUFDLFFBQVEsR0FBRyxTQUFTLGNBQWM7QUFDbkUsZ0JBQU0sbUJBQW1CLENBQUMsa0JBQWtCLHFCQUFxQixnQkFBZ0IsY0FBYztBQUMvRixnQkFBTSxhQUFhLGlCQUFpQixTQUFTLFFBQVEsSUFBSTtBQUd6RCxjQUFJLGFBQWEsWUFBWTtBQUMzQixrQkFBTSxXQUFXLEdBQUcsU0FBUyxNQUFNLFFBQVEsSUFBSSxLQUFLLFFBQVEsT0FBTztBQUFBO0FBQ25FLGVBQUcsZUFBZSxzQkFBc0IsUUFBUTtBQUVoRCxvQkFBUSxJQUFJLDJCQUFvQixRQUFRLE1BQU0sUUFBUSxPQUFPO0FBQzdELGdCQUFJLFFBQVEsR0FBSSxTQUFRLElBQUksZ0JBQVMsUUFBUSxFQUFFO0FBQy9DLGlCQUFLLE9BQU87QUFBQSxVQUNkO0FBQUEsUUFJRjtBQUFBLE1BQ0Y7QUFBQTtBQUFBLE1BR0EsdUJBQXVCO0FBQUEsTUFFdkIsUUFBUTtBQUFBLE1BQ1IsV0FBVyxTQUFTO0FBQUE7QUFBQSxNQUdwQixHQUFJLFNBQVMsZ0JBQWdCO0FBQUEsUUFDM0IsU0FBUztBQUFBLFVBQ1AsTUFBTSxDQUFDLFdBQVcsVUFBVTtBQUFBLFVBQzVCLGVBQWU7QUFBQSxRQUNqQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUE7QUFBQSxJQUdBLGNBQWM7QUFBQSxNQUNaLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsTUFDN0IsT0FBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
