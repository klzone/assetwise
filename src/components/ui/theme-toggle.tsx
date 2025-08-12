"use client";

import React from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

function getInitialTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  const stored = window.localStorage.getItem("theme")
  if (stored === "light" || stored === "dark") return stored
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }
  return "light"
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<"light" | "dark">(getInitialTheme)

  React.useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    window.localStorage.setItem("theme", theme)
  }, [theme])

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={theme === "dark" ? "切换到明亮主题" : "切换到暗黑主题"}
      className="relative h-9 w-9 rounded-full transition-colors duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={toggleTheme}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">主题切换</span>
    </Button>
  )
}

export default ThemeToggle