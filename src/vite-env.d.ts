/// <reference types="vite/client" />

declare module '*.svg'  { const src: string; export default src; }
declare module '*.png'  { const src: string; export default src; }
declare module '*.jpg'  { const src: string; export default src; }
declare module '*.jpeg' { const src: string; export default src; }
declare module '*.webp' { const src: string; export default src; }
declare module '*.gif'  { const src: string; export default src; }
declare module '*.mp4'  { const src: string; export default src; }
declare module '*.webm' { const src: string; export default src; }

declare module '*.md?raw'  { const src: string; export default src; }
declare module '*.txt?raw' { const src: string; export default src; }
declare module '*.svg?raw' { const src: string; export default src; }

declare module '*?url' { const src: string; export default src; }
