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
        // ✅ EMERGENCY FIX: Disable ALL code splitting
        output: {
          manualChunks: () => "everything",
          // Force everything into one chunk
          // ✅ Simplified naming to avoid weird hashes
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]"
        },
        // ✅ Handle dynamic imports more safely
        external: [],
        // ✅ Clean warnings
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
      // ✅ Large chunk size since we're using single bundle
      chunkSizeWarningLimit: 5e3,
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
    // ✅ Enhanced dependency optimization
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUsIGNvbW1hbmQgfSkgPT4ge1xuICBjb25zdCBwbHVnaW5zID0gW3JlYWN0KCldO1xuICBcbiAgaWYgKG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIikge1xuICAgIHBsdWdpbnMucHVzaChjb21wb25lbnRUYWdnZXIoKSk7XG4gIH1cbiAgXG4gIHJldHVybiB7XG4gICAgc2VydmVyOiB7XG4gICAgICBob3N0OiBcIjo6XCIsXG4gICAgICBwb3J0OiA4MDgwLFxuICAgIH0sXG4gICAgcGx1Z2lucyxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgICAgXCJyZWFjdFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0XCIpLFxuICAgICAgICBcInJlYWN0LWRvbVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vbm9kZV9tb2R1bGVzL3JlYWN0LWRvbVwiKSxcbiAgICAgIH0sXG4gICAgICBkZWR1cGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCJdLFxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIHRhcmdldDogJ2VzMjAyMCcsXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIC8vIFx1MjcwNSBFTUVSR0VOQ1kgRklYOiBEaXNhYmxlIEFMTCBjb2RlIHNwbGl0dGluZ1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBtYW51YWxDaHVua3M6ICgpID0+ICdldmVyeXRoaW5nJywgLy8gRm9yY2UgZXZlcnl0aGluZyBpbnRvIG9uZSBjaHVua1xuICAgICAgICAgIC8vIFx1MjcwNSBTaW1wbGlmaWVkIG5hbWluZyB0byBhdm9pZCB3ZWlyZCBoYXNoZXNcbiAgICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2Fzc2V0cy9bbmFtZV0uanMnLFxuICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiAnYXNzZXRzL1tuYW1lXS5qcycsXG4gICAgICAgICAgYXNzZXRGaWxlTmFtZXM6ICdhc3NldHMvW25hbWVdLltleHRdJ1xuICAgICAgICB9LFxuICAgICAgICBcbiAgICAgICAgLy8gXHUyNzA1IEhhbmRsZSBkeW5hbWljIGltcG9ydHMgbW9yZSBzYWZlbHlcbiAgICAgICAgZXh0ZXJuYWw6IFtdLFxuICAgICAgICBcbiAgICAgICAgLy8gXHUyNzA1IENsZWFuIHdhcm5pbmdzXG4gICAgICAgIG9ud2Fybih3YXJuaW5nLCB3YXJuKSB7XG4gICAgICAgICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGlzQXBwQ29kZSA9IHdhcm5pbmcuaWQgJiYgIXdhcm5pbmcuaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpO1xuICAgICAgICAgIGNvbnN0IGNyaXRpY2FsV2FybmluZ3MgPSBbJ01JU1NJTkdfRVhQT1JUJywgJ1VOUkVTT0xWRURfSU1QT1JUJywgJ0VNUFRZX0JVTkRMRScsICdQTFVHSU5fRVJST1InXTtcbiAgICAgICAgICBjb25zdCBpc0NyaXRpY2FsID0gY3JpdGljYWxXYXJuaW5ncy5pbmNsdWRlcyh3YXJuaW5nLmNvZGUpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmIChpc0FwcENvZGUgfHwgaXNDcml0aWNhbCkge1xuICAgICAgICAgICAgY29uc3QgbG9nRW50cnkgPSBgJHt0aW1lc3RhbXB9IC0gJHt3YXJuaW5nLmNvZGV9OiAke3dhcm5pbmcubWVzc2FnZX1cXG5gO1xuICAgICAgICAgICAgZnMuYXBwZW5kRmlsZVN5bmMoJ2J1aWxkLXdhcm5pbmdzLmxvZycsIGxvZ0VudHJ5KTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc29sZS5sb2coJ1x1RDgzRFx1REVBOCBDT0RFIFdBUk5JTkc6Jywgd2FybmluZy5jb2RlLCB3YXJuaW5nLm1lc3NhZ2UpO1xuICAgICAgICAgICAgaWYgKHdhcm5pbmcuaWQpIGNvbnNvbGUubG9nKCcgICBcdUQ4M0RcdURDQzEnLCB3YXJuaW5nLmlkKTtcbiAgICAgICAgICAgIHdhcm4od2FybmluZyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBcdTI3MDUgTGFyZ2UgY2h1bmsgc2l6ZSBzaW5jZSB3ZSdyZSB1c2luZyBzaW5nbGUgYnVuZGxlXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDUwMDAsXG4gICAgICBcbiAgICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxuICAgICAgc291cmNlbWFwOiBtb2RlID09PSAnZGV2ZWxvcG1lbnQnLFxuICAgICAgXG4gICAgICAvLyBcdTI3MDUgUHJvZHVjdGlvbiBvcHRpbWl6YXRpb25zXG4gICAgICAuLi4obW9kZSA9PT0gJ3Byb2R1Y3Rpb24nICYmIHtcbiAgICAgICAgZXNidWlsZDoge1xuICAgICAgICAgIGRyb3A6IFsnY29uc29sZScsICdkZWJ1Z2dlciddLFxuICAgICAgICAgIGxlZ2FsQ29tbWVudHM6ICdub25lJ1xuICAgICAgICB9XG4gICAgICB9KVxuICAgIH0sXG4gICAgXG4gICAgLy8gXHUyNzA1IEVuaGFuY2VkIGRlcGVuZGVuY3kgb3B0aW1pemF0aW9uXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICBpbmNsdWRlOiBbXG4gICAgICAgIFwicmVhY3RcIiwgXG4gICAgICAgIFwicmVhY3QtZG9tXCIsIFxuICAgICAgICBcInJlYWN0L2pzeC1ydW50aW1lXCIsXG4gICAgICAgIFwicmVhY3QvanN4LWRldi1ydW50aW1lXCIsXG4gICAgICAgIFwicmVhY3Qtcm91dGVyLWRvbVwiLFxuICAgICAgICBcImx1Y2lkZS1yZWFjdFwiLFxuICAgICAgICBcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiLFxuICAgICAgICBcImNsc3hcIixcbiAgICAgICAgXCJ0YWlsd2luZC1tZXJnZVwiXG4gICAgICBdLFxuICAgICAgZGVkdXBlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcbiAgICAgIGZvcmNlOiB0cnVlXG4gICAgfVxuICB9O1xufSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLE9BQU8sUUFBUTtBQUNmLFNBQVMsdUJBQXVCO0FBSmhDLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsTUFBTSxRQUFRLE1BQU07QUFDakQsUUFBTSxVQUFVLENBQUMsTUFBTSxDQUFDO0FBRXhCLE1BQUksU0FBUyxlQUFlO0FBQzFCLFlBQVEsS0FBSyxnQkFBZ0IsQ0FBQztBQUFBLEVBQ2hDO0FBRUEsU0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLElBQ1I7QUFBQSxJQUNBO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsUUFDcEMsU0FBUyxLQUFLLFFBQVEsa0NBQVcsc0JBQXNCO0FBQUEsUUFDdkQsYUFBYSxLQUFLLFFBQVEsa0NBQVcsMEJBQTBCO0FBQUEsTUFDakU7QUFBQSxNQUNBLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxJQUMvQjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsZUFBZTtBQUFBO0FBQUEsUUFFYixRQUFRO0FBQUEsVUFDTixjQUFjLE1BQU07QUFBQTtBQUFBO0FBQUEsVUFFcEIsZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsVUFDaEIsZ0JBQWdCO0FBQUEsUUFDbEI7QUFBQTtBQUFBLFFBR0EsVUFBVSxDQUFDO0FBQUE7QUFBQSxRQUdYLE9BQU8sU0FBUyxNQUFNO0FBQ3BCLGdCQUFNLGFBQVksb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFFekMsZ0JBQU0sWUFBWSxRQUFRLE1BQU0sQ0FBQyxRQUFRLEdBQUcsU0FBUyxjQUFjO0FBQ25FLGdCQUFNLG1CQUFtQixDQUFDLGtCQUFrQixxQkFBcUIsZ0JBQWdCLGNBQWM7QUFDL0YsZ0JBQU0sYUFBYSxpQkFBaUIsU0FBUyxRQUFRLElBQUk7QUFFekQsY0FBSSxhQUFhLFlBQVk7QUFDM0Isa0JBQU0sV0FBVyxHQUFHLFNBQVMsTUFBTSxRQUFRLElBQUksS0FBSyxRQUFRLE9BQU87QUFBQTtBQUNuRSxlQUFHLGVBQWUsc0JBQXNCLFFBQVE7QUFFaEQsb0JBQVEsSUFBSSwyQkFBb0IsUUFBUSxNQUFNLFFBQVEsT0FBTztBQUM3RCxnQkFBSSxRQUFRLEdBQUksU0FBUSxJQUFJLGdCQUFTLFFBQVEsRUFBRTtBQUMvQyxpQkFBSyxPQUFPO0FBQUEsVUFDZDtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUE7QUFBQSxNQUdBLHVCQUF1QjtBQUFBLE1BRXZCLFFBQVE7QUFBQSxNQUNSLFdBQVcsU0FBUztBQUFBO0FBQUEsTUFHcEIsR0FBSSxTQUFTLGdCQUFnQjtBQUFBLFFBQzNCLFNBQVM7QUFBQSxVQUNQLE1BQU0sQ0FBQyxXQUFXLFVBQVU7QUFBQSxVQUM1QixlQUFlO0FBQUEsUUFDakI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBO0FBQUEsSUFHQSxjQUFjO0FBQUEsTUFDWixTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsTUFDRjtBQUFBLE1BQ0EsUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLE1BQzdCLE9BQU87QUFBQSxJQUNUO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
