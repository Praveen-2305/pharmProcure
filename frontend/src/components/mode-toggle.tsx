import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './theme-provider';

export function ModeToggle() {
  const { theme, toggleThemeWithCurtain } = useTheme();

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => {
    toggleThemeWithCurtain();
  };

  return (
    <button
      onClick={toggleTheme}
      title="Toggle Light/Dark Theme"
      className="relative size-9 rounded-full flex items-center justify-center transition-all duration-300 outline-none select-none cursor-pointer overflow-hidden
        bg-background/90 border border-border/50
        shadow-[3px_3px_8px_rgba(0,0,0,0.08),-3px_-3px_8px_rgba(255,255,255,0.9)]
        hover:shadow-[1px_1px_4px_rgba(0,0,0,0.06),-1px_-1px_4px_rgba(255,255,255,0.8)]
        active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.12),inset_-2px_-2px_5px_rgba(255,255,255,0.7)]
        dark:bg-zinc-900/90 dark:border-zinc-800
        dark:shadow-[3px_3px_8px_rgba(0,0,0,0.5),-3px_-3px_8px_rgba(255,255,255,0.04)]
        dark:hover:shadow-[1px_1px_4px_rgba(0,0,0,0.4),-1px_-1px_4px_rgba(255,255,255,0.03)]
        dark:active:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.6),inset_-2px_-2px_5px_rgba(255,255,255,0.02)]"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isDark ? 'dark' : 'light'}
          initial={{ y: -18, opacity: 0, scale: 0.6, rotate: -45 }}
          animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
          exit={{ y: 18, opacity: 0, scale: 0.6, rotate: 45 }}
          transition={{ 
            duration: 0.35, 
            ease: [0.16, 1, 0.3, 1] 
          }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Moon className="size-4 text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.5)]" />
          ) : (
            <Sun className="size-4 text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
          )}
        </motion.div>
      </AnimatePresence>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
