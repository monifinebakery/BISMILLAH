// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";
import { visualizer } from "file:///home/project/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode, command }) => {
  const plugins = [
    react()
  ];
  if (mode === "development") {
    plugins.push(componentTagger());
  }
  if (command === "build") {
    plugins.push(visualizer({ open: true, filename: "dist/stats.html" }));
  }
  return {
    server: {
      host: "::",
      port: 8080
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("react-dom") || id.includes("react")) {
                return "vendor_react";
              }
              if (id.includes("recharts") || id.includes("d3-")) {
                return "vendor_charts";
              }
              if (id.includes("date-fns") || id.includes("react-day-picker")) {
                return "vendor_date";
              }
              if (id.includes("@supabase")) return "vendor_supabase";
              if (id.includes("lucide-react")) return "vendor_lucide";
              return "vendor_others";
            }
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSwgY29tbWFuZCB9KSA9PiB7XG4gIGNvbnN0IHBsdWdpbnMgPSBbXG4gICAgcmVhY3QoKSxcbiAgXTtcblxuICBpZiAobW9kZSA9PT0gJ2RldmVsb3BtZW50Jykge1xuICAgIHBsdWdpbnMucHVzaChjb21wb25lbnRUYWdnZXIoKSk7XG4gIH1cblxuICBpZiAoY29tbWFuZCA9PT0gJ2J1aWxkJykge1xuICAgIHBsdWdpbnMucHVzaCh2aXN1YWxpemVyKHsgb3BlbjogdHJ1ZSwgZmlsZW5hbWU6IFwiZGlzdC9zdGF0cy5odG1sXCIgfSkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IFwiOjpcIixcbiAgICAgIHBvcnQ6IDgwODAsXG4gICAgfSxcbiAgICBwbHVnaW5zLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rcyhpZDogc3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyBcdTI3MDUgLS0tIFBFUkJBSUtBTiBVVEFNQSBESSBTSU5JIC0tLVxuICAgICAgICAgICAgICAvLyAxLiBHYWJ1bmdrYW4gcmVhY3QgZGFuIHJlYWN0LWRvbSBrZSBkYWxhbSBzYXR1IGNodW5rLlxuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0LWRvbScpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdCcpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3JfcmVhY3QnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyAyLiBQaXNhaGthbiBsaWJyYXJ5IGNoYXJ0IHlhbmcgc2FuZ2F0IGJlc2FyXG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVjaGFydHMnKSB8fCBpZC5pbmNsdWRlcygnZDMtJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcl9jaGFydHMnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyAzLiBQaXNhaGthbiBsaWJyYXJ5IGthbGVuZGVyL3RhbmdnYWxcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdkYXRlLWZucycpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kYXktcGlja2VyJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcl9kYXRlJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy8gNC4gQXR1cmFuIGxhaW4geWFuZyBzdWRhaCBhZGFcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAc3VwYWJhc2UnKSkgcmV0dXJuICd2ZW5kb3Jfc3VwYWJhc2UnO1xuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2x1Y2lkZS1yZWFjdCcpKSByZXR1cm4gJ3ZlbmRvcl9sdWNpZGUnO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy8gS2VyYW5qYW5nIHNpc2EgdW50dWsgbGlicmFyeSBsYWluXG4gICAgICAgICAgICAgIHJldHVybiAndmVuZG9yX290aGVycyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxrQkFBa0I7QUFKM0IsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxNQUFNLFFBQVEsTUFBTTtBQUNqRCxRQUFNLFVBQVU7QUFBQSxJQUNkLE1BQU07QUFBQSxFQUNSO0FBRUEsTUFBSSxTQUFTLGVBQWU7QUFDMUIsWUFBUSxLQUFLLGdCQUFnQixDQUFDO0FBQUEsRUFDaEM7QUFFQSxNQUFJLFlBQVksU0FBUztBQUN2QixZQUFRLEtBQUssV0FBVyxFQUFFLE1BQU0sTUFBTSxVQUFVLGtCQUFrQixDQUFDLENBQUM7QUFBQSxFQUN0RTtBQUVBLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxJQUNSO0FBQUEsSUFDQTtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sYUFBYSxJQUFZO0FBQ3ZCLGdCQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFJL0Isa0JBQUksR0FBRyxTQUFTLFdBQVcsS0FBSyxHQUFHLFNBQVMsT0FBTyxHQUFHO0FBQ3BELHVCQUFPO0FBQUEsY0FDVDtBQUdBLGtCQUFJLEdBQUcsU0FBUyxVQUFVLEtBQUssR0FBRyxTQUFTLEtBQUssR0FBRztBQUNqRCx1QkFBTztBQUFBLGNBQ1Q7QUFHQSxrQkFBSSxHQUFHLFNBQVMsVUFBVSxLQUFLLEdBQUcsU0FBUyxrQkFBa0IsR0FBRztBQUM5RCx1QkFBTztBQUFBLGNBQ1Q7QUFHQSxrQkFBSSxHQUFHLFNBQVMsV0FBVyxFQUFHLFFBQU87QUFDckMsa0JBQUksR0FBRyxTQUFTLGNBQWMsRUFBRyxRQUFPO0FBR3hDLHFCQUFPO0FBQUEsWUFDVDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
