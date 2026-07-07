import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";
import PlannerForm from "@/modules/planner/components/PlannerForm";
import GeneratedOutput from "@/modules/planner/components/GeneratedOutput";
import usePlanner from "@/modules/planner/hooks/usePlanner";

type ThemeMode = "light" | "dark";

export default function PlannerPage(): JSX.Element {
  const planner = usePlanner();
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      return stored;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <main className="relative mx-auto min-h-screen w-full max-w-[1280px] px-4 py-6">
      <div className="pointer-events-none absolute -left-12 -top-10 h-72 w-72 rounded-full bg-orange-300/40 blur-3xl dark:bg-orange-500/15" />
      <div className="pointer-events-none absolute -bottom-16 -right-10 h-80 w-80 rounded-full bg-cyan-300/35 blur-3xl dark:bg-cyan-500/15" />
      <div className="relative mb-4 flex items-center justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={isDark}
          aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
          onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
          className="gap-2"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? t("theme.light") : t("theme.dark")}
        </Button>
      </div>
      <div className="relative grid grid-cols-1 gap-4 xl:grid-cols-[1.08fr_1fr]">
        <PlannerForm planner={planner} />
        <GeneratedOutput planner={planner} />
      </div>
    </main>
  );
}
