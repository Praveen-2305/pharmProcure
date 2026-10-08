import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CopilotSlideOver } from './features/copilot/CopilotSlideOver';
import { Sparkles } from 'lucide-react';
import { Button } from './components/ui/button';

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Global Ctrl+K / Cmd+K listener to open AI Copilot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCopilotOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground font-sans">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar isOpen={isSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-background relative animate-fade-in">
          <Outlet />

          {/* Floating AI Copilot Trigger Button */}
          <div className="fixed bottom-6 right-6 z-40">
            <Button
              onClick={() => setIsCopilotOpen(true)}
              className="h-11 px-4 rounded-full shadow-2xl bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500 text-primary-foreground font-semibold flex items-center gap-2 border border-primary/30 group hover:scale-105 transition-all"
            >
              <Sparkles className="size-4 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span className="text-xs">Ask Copilot</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-black/20 rounded border border-white/20 ml-1">
                Ctrl+K
              </kbd>
            </Button>
          </div>
        </main>
      </div>

      {/* Global Slide-Over Panel */}
      <CopilotSlideOver
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />
    </div>
  );
};

export default App;

