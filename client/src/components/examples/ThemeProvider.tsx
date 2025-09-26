import { ThemeProvider } from "../ThemeProvider";
import { Button } from "@/components/ui/button";
import { useTheme } from "../ThemeProvider";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Theme Provider Example</h2>
      <p className="text-muted-foreground">Current theme: {theme}</p>
      <div className="space-x-2">
        <Button 
          onClick={() => setTheme("light")} 
          variant={theme === "light" ? "default" : "outline"}
        >
          Light
        </Button>
        <Button 
          onClick={() => setTheme("dark")} 
          variant={theme === "dark" ? "default" : "outline"}
        >
          Dark
        </Button>
      </div>
    </div>
  );
}

export default function ThemeProviderExample() {
  return (
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}