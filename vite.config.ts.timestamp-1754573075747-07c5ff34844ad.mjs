// vite.config.ts
import { defineConfig, loadEnv } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import fs from "fs";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const plugins = [react()];
  if (mode === "development") {
    plugins.push(componentTagger());
  }
  const isDev = mode === "development";
  const isProd = mode === "production";
  console.log(`\u{1F50D} Vite Mode: ${mode}`);
  console.log(`\u{1F50D} Environment Variables:`, {
    VITE_DEBUG_LEVEL: env.VITE_DEBUG_LEVEL,
    VITE_DEBUG_COMPONENT: env.VITE_DEBUG_COMPONENT,
    VITE_FORCE_LOGS: env.VITE_FORCE_LOGS
  });
  const define = {
    __DEV__: JSON.stringify(isDev),
    __PROD__: JSON.stringify(isProd),
    __MODE__: JSON.stringify(mode)
  };
  return {
    define,
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
      sourcemap: isDev,
      // ✅ ENHANCED: Aggressive console removal in production
      ...isProd && {
        esbuild: {
          // ✅ ALWAYS drop console in production (unless explicitly forced for debugging)
          drop: env.VITE_FORCE_LOGS === "true" ? ["debugger"] : ["console", "debugger"],
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBcdTI3MDUgRU5IQU5DRUQ6IExvYWQgZW52aXJvbm1lbnQgdmFyaWFibGVzXG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xuICBcbiAgY29uc3QgcGx1Z2lucyA9IFtyZWFjdCgpXTtcbiAgXG4gIGlmIChtb2RlID09PSBcImRldmVsb3BtZW50XCIpIHtcbiAgICBwbHVnaW5zLnB1c2goY29tcG9uZW50VGFnZ2VyKCkpO1xuICB9XG4gIFxuICAvLyBcdTI3MDUgRU5IQU5DRUQ6IEJldHRlciBlbnZpcm9ubWVudCBkZXRlY3Rpb25cbiAgY29uc3QgaXNEZXYgPSBtb2RlID09PSAnZGV2ZWxvcG1lbnQnO1xuICBjb25zdCBpc1Byb2QgPSBtb2RlID09PSAncHJvZHVjdGlvbic7XG4gIFxuICAvLyBcdTI3MDUgRGVidWcgZW52aXJvbm1lbnQgbG9hZGluZ1xuICBjb25zb2xlLmxvZyhgXHVEODNEXHVERDBEIFZpdGUgTW9kZTogJHttb2RlfWApO1xuICBjb25zb2xlLmxvZyhgXHVEODNEXHVERDBEIEVudmlyb25tZW50IFZhcmlhYmxlczpgLCB7XG4gICAgVklURV9ERUJVR19MRVZFTDogZW52LlZJVEVfREVCVUdfTEVWRUwsXG4gICAgVklURV9ERUJVR19DT01QT05FTlQ6IGVudi5WSVRFX0RFQlVHX0NPTVBPTkVOVCxcbiAgICBWSVRFX0ZPUkNFX0xPR1M6IGVudi5WSVRFX0ZPUkNFX0xPR1MsXG4gIH0pO1xuICBcbiAgY29uc3QgZGVmaW5lID0ge1xuICAgIF9fREVWX186IEpTT04uc3RyaW5naWZ5KGlzRGV2KSxcbiAgICBfX1BST0RfXzogSlNPTi5zdHJpbmdpZnkoaXNQcm9kKSxcbiAgICBfX01PREVfXzogSlNPTi5zdHJpbmdpZnkobW9kZSksXG4gIH07XG4gIFxuICByZXR1cm4ge1xuICAgIGRlZmluZSxcbiAgICBcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IFwiOjpcIixcbiAgICAgIHBvcnQ6IDgwODAsXG4gICAgfSxcbiAgICBwbHVnaW5zLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgICByZWFjdDogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL25vZGVfbW9kdWxlcy9yZWFjdFwiKSxcbiAgICAgICAgXCJyZWFjdC1kb21cIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL25vZGVfbW9kdWxlcy9yZWFjdC1kb21cIiksXG4gICAgICB9LFxuICAgICAgZGVkdXBlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICB0YXJnZXQ6IFwiZXMyMDIwXCIsXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rczogKCkgPT4gXCJldmVyeXRoaW5nXCIsXG4gICAgICAgICAgZW50cnlGaWxlTmFtZXM6IFwiYXNzZXRzL1tuYW1lXS5qc1wiLFxuICAgICAgICAgIGNodW5rRmlsZU5hbWVzOiBcImFzc2V0cy9bbmFtZV0uanNcIixcbiAgICAgICAgICBhc3NldEZpbGVOYW1lczogXCJhc3NldHMvW25hbWVdLltleHRdXCIsXG4gICAgICAgIH0sXG4gICAgICAgIGV4dGVybmFsOiBbXSxcbiAgICAgICAgb253YXJuKHdhcm5pbmcsIHdhcm4pIHtcbiAgICAgICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgICAgY29uc3QgaXNBcHBDb2RlID1cbiAgICAgICAgICAgIHdhcm5pbmcuaWQgJiYgIXdhcm5pbmcuaWQuaW5jbHVkZXMoXCJub2RlX21vZHVsZXNcIik7XG4gICAgICAgICAgY29uc3QgY3JpdGljYWxXYXJuaW5ncyA9IFtcbiAgICAgICAgICAgIFwiTUlTU0lOR19FWFBPUlRcIixcbiAgICAgICAgICAgIFwiVU5SRVNPTFZFRF9JTVBPUlRcIixcbiAgICAgICAgICAgIFwiRU1QVFlfQlVORExFXCIsXG4gICAgICAgICAgICBcIlBMVUdJTl9FUlJPUlwiLFxuICAgICAgICAgIF07XG4gICAgICAgICAgY29uc3QgaXNDcml0aWNhbCA9IGNyaXRpY2FsV2FybmluZ3MuaW5jbHVkZXMod2FybmluZy5jb2RlKTtcbiAgICAgICAgICBpZiAoaXNBcHBDb2RlIHx8IGlzQ3JpdGljYWwpIHtcbiAgICAgICAgICAgIGNvbnN0IGxvZ0VudHJ5ID0gYCR7dGltZXN0YW1wfSAtICR7d2FybmluZy5jb2RlfTogJHt3YXJuaW5nLm1lc3NhZ2V9XFxuYDtcbiAgICAgICAgICAgIGZzLmFwcGVuZEZpbGVTeW5jKFwiYnVpbGQtd2FybmluZ3MubG9nXCIsIGxvZ0VudHJ5KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiXHVEODNEXHVERUE4IENPREUgV0FSTklORzpcIiwgd2FybmluZy5jb2RlLCB3YXJuaW5nLm1lc3NhZ2UpO1xuICAgICAgICAgICAgaWYgKHdhcm5pbmcuaWQpIGNvbnNvbGUubG9nKFwiICAgXHVEODNEXHVEQ0MxXCIsIHdhcm5pbmcuaWQpO1xuICAgICAgICAgICAgd2Fybih3YXJuaW5nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA1MDAwLFxuICAgICAgbWluaWZ5OiBcImVzYnVpbGRcIixcbiAgICAgIHNvdXJjZW1hcDogaXNEZXYsXG4gICAgICBcbiAgICAgIC8vIFx1MjcwNSBFTkhBTkNFRDogQWdncmVzc2l2ZSBjb25zb2xlIHJlbW92YWwgaW4gcHJvZHVjdGlvblxuICAgICAgLi4uKGlzUHJvZCAmJiB7XG4gICAgICAgIGVzYnVpbGQ6IHtcbiAgICAgICAgICAvLyBcdTI3MDUgQUxXQVlTIGRyb3AgY29uc29sZSBpbiBwcm9kdWN0aW9uICh1bmxlc3MgZXhwbGljaXRseSBmb3JjZWQgZm9yIGRlYnVnZ2luZylcbiAgICAgICAgICBkcm9wOiBlbnYuVklURV9GT1JDRV9MT0dTID09PSAndHJ1ZScgPyBbXCJkZWJ1Z2dlclwiXSA6IFtcImNvbnNvbGVcIiwgXCJkZWJ1Z2dlclwiXSxcbiAgICAgICAgICBsZWdhbENvbW1lbnRzOiBcIm5vbmVcIixcbiAgICAgICAgfSxcbiAgICAgIH0pLFxuICAgIH0sXG4gICAgb3B0aW1pemVEZXBzOiB7XG4gICAgICBpbmNsdWRlOiBbXG4gICAgICAgIFwicmVhY3RcIixcbiAgICAgICAgXCJyZWFjdC1kb21cIixcbiAgICAgICAgXCJyZWFjdC9qc3gtcnVudGltZVwiLFxuICAgICAgICBcInJlYWN0L2pzeC1kZXYtcnVudGltZVwiLFxuICAgICAgICBcInJlYWN0LXJvdXRlci1kb21cIixcbiAgICAgICAgXCJsdWNpZGUtcmVhY3RcIixcbiAgICAgICAgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIixcbiAgICAgICAgXCJjbHN4XCIsXG4gICAgICAgIFwidGFpbHdpbmQtbWVyZ2VcIixcbiAgICAgIF0sXG4gICAgICBkZWR1cGU6IFtcInJlYWN0XCIsIFwicmVhY3QtZG9tXCJdLFxuICAgICAgZm9yY2U6IHRydWUsXG4gICAgfSxcbiAgfTtcbn0pOyJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxjQUFjLGVBQWU7QUFDL1AsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFDZixTQUFTLHVCQUF1QjtBQUpoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUV4QyxRQUFNLE1BQU0sUUFBUSxNQUFNLFFBQVEsSUFBSSxHQUFHLEVBQUU7QUFFM0MsUUFBTSxVQUFVLENBQUMsTUFBTSxDQUFDO0FBRXhCLE1BQUksU0FBUyxlQUFlO0FBQzFCLFlBQVEsS0FBSyxnQkFBZ0IsQ0FBQztBQUFBLEVBQ2hDO0FBR0EsUUFBTSxRQUFRLFNBQVM7QUFDdkIsUUFBTSxTQUFTLFNBQVM7QUFHeEIsVUFBUSxJQUFJLHdCQUFpQixJQUFJLEVBQUU7QUFDbkMsVUFBUSxJQUFJLG9DQUE2QjtBQUFBLElBQ3ZDLGtCQUFrQixJQUFJO0FBQUEsSUFDdEIsc0JBQXNCLElBQUk7QUFBQSxJQUMxQixpQkFBaUIsSUFBSTtBQUFBLEVBQ3ZCLENBQUM7QUFFRCxRQUFNLFNBQVM7QUFBQSxJQUNiLFNBQVMsS0FBSyxVQUFVLEtBQUs7QUFBQSxJQUM3QixVQUFVLEtBQUssVUFBVSxNQUFNO0FBQUEsSUFDL0IsVUFBVSxLQUFLLFVBQVUsSUFBSTtBQUFBLEVBQy9CO0FBRUEsU0FBTztBQUFBLElBQ0w7QUFBQSxJQUVBLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxJQUNSO0FBQUEsSUFDQTtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLFFBQ3BDLE9BQU8sS0FBSyxRQUFRLGtDQUFXLHNCQUFzQjtBQUFBLFFBQ3JELGFBQWEsS0FBSyxRQUFRLGtDQUFXLDBCQUEwQjtBQUFBLE1BQ2pFO0FBQUEsTUFDQSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsSUFDL0I7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxVQUNOLGNBQWMsTUFBTTtBQUFBLFVBQ3BCLGdCQUFnQjtBQUFBLFVBQ2hCLGdCQUFnQjtBQUFBLFVBQ2hCLGdCQUFnQjtBQUFBLFFBQ2xCO0FBQUEsUUFDQSxVQUFVLENBQUM7QUFBQSxRQUNYLE9BQU8sU0FBUyxNQUFNO0FBQ3BCLGdCQUFNLGFBQVksb0JBQUksS0FBSyxHQUFFLFlBQVk7QUFDekMsZ0JBQU0sWUFDSixRQUFRLE1BQU0sQ0FBQyxRQUFRLEdBQUcsU0FBUyxjQUFjO0FBQ25ELGdCQUFNLG1CQUFtQjtBQUFBLFlBQ3ZCO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUNBLGdCQUFNLGFBQWEsaUJBQWlCLFNBQVMsUUFBUSxJQUFJO0FBQ3pELGNBQUksYUFBYSxZQUFZO0FBQzNCLGtCQUFNLFdBQVcsR0FBRyxTQUFTLE1BQU0sUUFBUSxJQUFJLEtBQUssUUFBUSxPQUFPO0FBQUE7QUFDbkUsZUFBRyxlQUFlLHNCQUFzQixRQUFRO0FBQ2hELG9CQUFRLElBQUksMkJBQW9CLFFBQVEsTUFBTSxRQUFRLE9BQU87QUFDN0QsZ0JBQUksUUFBUSxHQUFJLFNBQVEsSUFBSSxnQkFBUyxRQUFRLEVBQUU7QUFDL0MsaUJBQUssT0FBTztBQUFBLFVBQ2Q7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLE1BQ0EsdUJBQXVCO0FBQUEsTUFDdkIsUUFBUTtBQUFBLE1BQ1IsV0FBVztBQUFBO0FBQUEsTUFHWCxHQUFJLFVBQVU7QUFBQSxRQUNaLFNBQVM7QUFBQTtBQUFBLFVBRVAsTUFBTSxJQUFJLG9CQUFvQixTQUFTLENBQUMsVUFBVSxJQUFJLENBQUMsV0FBVyxVQUFVO0FBQUEsVUFDNUUsZUFBZTtBQUFBLFFBQ2pCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGNBQWM7QUFBQSxNQUNaLFNBQVM7QUFBQSxRQUNQO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNGO0FBQUEsTUFDQSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQUEsTUFDN0IsT0FBTztBQUFBLElBQ1Q7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
