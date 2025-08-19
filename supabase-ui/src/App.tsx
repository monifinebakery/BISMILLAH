import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

function App() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-6 p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Shadcn/UI with Vite</h1>
          <p className="text-muted-foreground mt-2">
            A fresh React + TypeScript project with Tailwind CSS v4 and shadcn/ui
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <Button>Default Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="destructive">Destructive Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="link">Link Button</Button>
          
          <div className="pt-4 flex justify-center">
            <Button variant="outline" className="gap-2">
              <Github className="w-4 h-4" />
              GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App