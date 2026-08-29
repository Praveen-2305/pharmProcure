import React, { createContext, useContext, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleThemeWithCurtain: (targetTheme?: Theme) => void
  isCurtainActive: boolean
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  toggleThemeWithCurtain: () => null,
  isCurtainActive: false,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )
  const [isCurtainActive, setIsCurtainActive] = useState<boolean>(false)

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const setTheme = (nextTheme: Theme) => {
    localStorage.setItem(storageKey, nextTheme)
    setThemeState(nextTheme)
  }

  const toggleThemeWithCurtain = (targetTheme?: Theme) => {
    if (isCurtainActive) return;

    let nextTheme: Theme = targetTheme || "dark";
    if (!targetTheme) {
      if (theme === "dark") nextTheme = "light";
      else if (theme === "light") nextTheme = "dark";
      else {
        const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        nextTheme = isSystemDark ? "light" : "dark";
      }
    }

    // 1. Activate curtain
    setIsCurtainActive(true);

    // 2. Switch theme at curtain midpoint (300ms)
    setTimeout(() => {
      setTheme(nextTheme);
    }, 280);

    // 3. Deactivate curtain overlay after completion (650ms)
    setTimeout(() => {
      setIsCurtainActive(false);
    }, 650);
  }

  const value = {
    theme,
    setTheme,
    toggleThemeWithCurtain,
    isCurtainActive,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
      {/* Full Screen Curtain Theme Transition Overlay */}
      <AnimatePresence>
        {isCurtainActive && (
          <motion.div
            initial={{ y: "-100%" }}
            animate={{ y: ["-100%", "0%", "100%"] }}
            exit={{ y: "100%" }}
            transition={{
              duration: 0.65,
              times: [0, 0.45, 1],
              ease: [0.76, 0, 0.24, 1],
            }}
            className="fixed inset-0 z-[999999] pointer-events-none bg-zinc-950 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-950 shadow-2xl flex flex-col justify-between p-8 border-y-2 border-primary/40"
          >
            <div className="flex justify-between items-center text-xs font-mono tracking-widest uppercase opacity-40">
              <span>AUTONOSOURCE CURTAIN TRANSITION</span>
              <span>THEME ENGINE</span>
            </div>
            <div className="w-full text-center">
              <div className="font-extrabold tracking-tight text-3xl uppercase">
                AutonoSource
              </div>
              <div className="text-xs font-mono opacity-50 mt-1">
                SWITCHING THEME ENVIRONMENT
              </div>
            </div>
            <div className="flex justify-between items-center text-xs font-mono tracking-widest uppercase opacity-40">
              <span>ENTERPRISE GOVERNANCE</span>
              <span>2026</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  return context
}
