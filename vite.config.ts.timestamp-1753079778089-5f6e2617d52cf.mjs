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
              if (id.includes("recharts") || id.includes("d3-")) {
                return "vendor_charts";
              }
              if (id.includes("date-fns") || id.includes("react-day-picker")) {
                return "vendor_date";
              }
              if (id.includes("@supabase")) return "vendor_supabase";
              if (id.includes("lucide-react")) return "vendor_lucide";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSwgY29tbWFuZCB9KSA9PiB7XG4gIGNvbnN0IHBsdWdpbnMgPSBbXG4gICAgcmVhY3QoKSxcbiAgXTtcblxuICBpZiAobW9kZSA9PT0gJ2RldmVsb3BtZW50Jykge1xuICAgIHBsdWdpbnMucHVzaChjb21wb25lbnRUYWdnZXIoKSk7XG4gIH1cblxuICBpZiAoY29tbWFuZCA9PT0gJ2J1aWxkJykge1xuICAgIHBsdWdpbnMucHVzaCh2aXN1YWxpemVyKHsgb3BlbjogdHJ1ZSwgZmlsZW5hbWU6IFwiZGlzdC9zdGF0cy5odG1sXCIgfSkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6IFwiOjpcIixcbiAgICAgIHBvcnQ6IDgwODAsXG4gICAgfSxcbiAgICBwbHVnaW5zLFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiB7XG4gICAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgICAgfSxcbiAgICB9LFxuICAgIGJ1aWxkOiB7XG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rcyhpZDogc3RyaW5nKSB7XG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyAtLS0gUEVSQkFJS0FOIC0tLVxuICAgICAgICAgICAgICAvLyBLaXRhIGFrYW4gbWVtYmlhcmthbiBWaXRlIG1lbmFuZ2FuaSBSZWFjdCAmIFJlYWN0LURPTSBzZWNhcmEgb3RvbWF0aXMuXG4gICAgICAgICAgICAgIC8vIEtpdGEgaGFueWEgYWthbiBtZW1pc2Foa2FuIGxpYnJhcnkgYmVzYXIgbGFpbm55YS5cblxuICAgICAgICAgICAgICAvLyAxLiBQaXNhaGthbiBsaWJyYXJ5IGNoYXJ0IHlhbmcgc2FuZ2F0IGJlc2FyXG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygncmVjaGFydHMnKSB8fCBpZC5pbmNsdWRlcygnZDMtJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcl9jaGFydHMnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyAyLiBQaXNhaGthbiBsaWJyYXJ5IGthbGVuZGVyL3RhbmdnYWxcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdkYXRlLWZucycpIHx8IGlkLmluY2x1ZGVzKCdyZWFjdC1kYXktcGlja2VyJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvcl9kYXRlJztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy8gMy4gQXR1cmFuIGxhaW4geWFuZyBzdWRhaCBhZGFcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAc3VwYWJhc2UnKSkgcmV0dXJuICd2ZW5kb3Jfc3VwYWJhc2UnO1xuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2x1Y2lkZS1yZWFjdCcpKSByZXR1cm4gJ3ZlbmRvcl9sdWNpZGUnO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy8gQmlhcmthbiBzaXNhIG5vZGVfbW9kdWxlcyAodGVybWFzdWsgUmVhY3QpIGRpLWhhbmRsZSBvbGVoIFZpdGVcbiAgICAgICAgICAgICAgLy8gYXRhdSBtYXN1ayBrZSBkYWxhbSBjaHVuayB2ZW5kb3IgdW11bS5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUNoQyxTQUFTLGtCQUFrQjtBQUozQixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLE1BQU0sUUFBUSxNQUFNO0FBQ2pELFFBQU0sVUFBVTtBQUFBLElBQ2QsTUFBTTtBQUFBLEVBQ1I7QUFFQSxNQUFJLFNBQVMsZUFBZTtBQUMxQixZQUFRLEtBQUssZ0JBQWdCLENBQUM7QUFBQSxFQUNoQztBQUVBLE1BQUksWUFBWSxTQUFTO0FBQ3ZCLFlBQVEsS0FBSyxXQUFXLEVBQUUsTUFBTSxNQUFNLFVBQVUsa0JBQWtCLENBQUMsQ0FBQztBQUFBLEVBQ3RFO0FBRUEsU0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLElBQ1I7QUFBQSxJQUNBO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsTUFDdEM7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixhQUFhLElBQVk7QUFDdkIsZ0JBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQU8vQixrQkFBSSxHQUFHLFNBQVMsVUFBVSxLQUFLLEdBQUcsU0FBUyxLQUFLLEdBQUc7QUFDakQsdUJBQU87QUFBQSxjQUNUO0FBR0Esa0JBQUksR0FBRyxTQUFTLFVBQVUsS0FBSyxHQUFHLFNBQVMsa0JBQWtCLEdBQUc7QUFDOUQsdUJBQU87QUFBQSxjQUNUO0FBR0Esa0JBQUksR0FBRyxTQUFTLFdBQVcsRUFBRyxRQUFPO0FBQ3JDLGtCQUFJLEdBQUcsU0FBUyxjQUFjLEVBQUcsUUFBTztBQUFBLFlBSTFDO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
