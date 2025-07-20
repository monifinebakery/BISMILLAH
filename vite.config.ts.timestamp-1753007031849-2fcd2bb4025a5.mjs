// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.mjs";
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
              if (id.includes("@supabase")) return "vendor_supabase";
              if (id.includes("react-dom")) return "vendor_react-dom";
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tICdyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXInO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUsIGNvbW1hbmQgfSkgPT4ge1xuICBjb25zdCBwbHVnaW5zID0gW1xuICAgIHJlYWN0KCksXG4gIF07XG5cbiAgLy8gQWt0aWZrYW4gcGx1Z2luIGluaSBIQU5ZQSBzYWF0IGRldmVsb3BtZW50XG4gIGlmIChtb2RlID09PSAnZGV2ZWxvcG1lbnQnKSB7XG4gICAgcGx1Z2lucy5wdXNoKGNvbXBvbmVudFRhZ2dlcigpKTtcbiAgfVxuXG4gIC8vIEFrdGlma2FuIHZpc3VhbGl6ZXIgSEFOWUEgc2FhdCBtZW5qYWxhbmthbiBwZXJpbnRhaCAnYnVpbGQnXG4gIGlmIChjb21tYW5kID09PSAnYnVpbGQnKSB7XG4gICAgcGx1Z2lucy5wdXNoKHZpc3VhbGl6ZXIoeyBvcGVuOiB0cnVlLCBmaWxlbmFtZTogXCJkaXN0L3N0YXRzLmh0bWxcIiB9KSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHNlcnZlcjoge1xuICAgICAgaG9zdDogXCI6OlwiLFxuICAgICAgcG9ydDogODA4MCxcbiAgICB9LFxuICAgIHBsdWdpbnMsXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgICB9LFxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgbWFudWFsQ2h1bmtzKGlkOiBzdHJpbmcpIHtcbiAgICAgICAgICAgIC8vIExvZ2lrYSB1bnR1ayBtZW1lY2FoIHZlbmRvciBjaHVua3NcbiAgICAgICAgICAgIC8vIFNlbXVhIGxpYnJhcnkgZGFyaSBub2RlX21vZHVsZXMgYWthbiBkaXBlY2FoXG4gICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgICAgICAgIC8vIFBpc2Foa2FuIGxpYnJhcnkgYmVzYXIga2UgZGFsYW0gY2h1bmstbnlhIHNlbmRpcmlcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAc3VwYWJhc2UnKSkgcmV0dXJuICd2ZW5kb3Jfc3VwYWJhc2UnO1xuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3JlYWN0LWRvbScpKSByZXR1cm4gJ3ZlbmRvcl9yZWFjdC1kb20nO1xuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2x1Y2lkZS1yZWFjdCcpKSByZXR1cm4gJ3ZlbmRvcl9sdWNpZGUnO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy8gSmlrYSBhZGEgbGlicmFyeSBjaGFydCwgdGFtYmFoa2FuIGRpIHNpbmkuIENvbnRvaDpcbiAgICAgICAgICAgICAgLy8gaWYgKGlkLmluY2x1ZGVzKCdjaGFydC5qcycpKSByZXR1cm4gJ3ZlbmRvcl9jaGFydGpzJztcbiAgICAgICAgICAgICAgLy8gaWYgKGlkLmluY2x1ZGVzKCdyZWNoYXJ0cycpKSByZXR1cm4gJ3ZlbmRvcl9yZWNoYXJ0cyc7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyBTZW11YSBsaWJyYXJ5IGxhaW4gZGFyaSBub2RlX21vZHVsZXMgYWthbiBtYXN1ayBrZSAndmVuZG9yX290aGVycydcbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3Jfb3RoZXJzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxrQkFBa0I7QUFKM0IsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxNQUFNLFFBQVEsTUFBTTtBQUNqRCxRQUFNLFVBQVU7QUFBQSxJQUNkLE1BQU07QUFBQSxFQUNSO0FBR0EsTUFBSSxTQUFTLGVBQWU7QUFDMUIsWUFBUSxLQUFLLGdCQUFnQixDQUFDO0FBQUEsRUFDaEM7QUFHQSxNQUFJLFlBQVksU0FBUztBQUN2QixZQUFRLEtBQUssV0FBVyxFQUFFLE1BQU0sTUFBTSxVQUFVLGtCQUFrQixDQUFDLENBQUM7QUFBQSxFQUN0RTtBQUVBLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxJQUNSO0FBQUEsSUFDQTtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sYUFBYSxJQUFZO0FBR3ZCLGdCQUFJLEdBQUcsU0FBUyxjQUFjLEdBQUc7QUFFL0Isa0JBQUksR0FBRyxTQUFTLFdBQVcsRUFBRyxRQUFPO0FBQ3JDLGtCQUFJLEdBQUcsU0FBUyxXQUFXLEVBQUcsUUFBTztBQUNyQyxrQkFBSSxHQUFHLFNBQVMsY0FBYyxFQUFHLFFBQU87QUFPeEMscUJBQU87QUFBQSxZQUNUO0FBQUEsVUFDRjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
