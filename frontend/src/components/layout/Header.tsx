import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Command, Menu, ArrowLeft, Sparkles } from 'lucide-react';
import { ModeToggle } from '../mode-toggle';
import { Button, buttonVariants } from '../ui/button';
import { Separator } from '../ui/separator';
import { cn } from '../../lib/utils';

export const Header: React.FC<{ onMenuClick?: () => void }> = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="h-14 border-b bg-background/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 transition-all">
      <div className="flex items-center gap-2 md:gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
          title="Toggle navigation menu"
          className="mr-1 h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Menu className="size-5" />
        </Button>
        
        <Link to="/" className="flex items-center gap-2 group">
          <div className="size-7 rounded bg-primary flex items-center justify-center group-hover:scale-105 transition-transform duration-150 shadow-xs">
            <Command className="size-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground flex items-center gap-1.5">
            AutonoSource
            <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              v1.0
            </span>
          </span>
        </Link>

        <Separator orientation="vertical" className="h-5 mx-1 hidden sm:block" />

        {/* Prominent Back to Home Button */}
        <Link
          to="/"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hidden sm:flex border-border/60 bg-muted/20 hover:bg-muted/50 rounded-lg px-3'
          )}
        >
          <ArrowLeft className="size-3.5 text-primary" />
          <span>Home</span>
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <Link
          to="/"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'gap-1.5 text-xs font-medium text-foreground sm:hidden'
          )}
        >
          <Sparkles className="size-3 text-primary" />
          <span>Home</span>
        </Link>

        <ModeToggle />

        <div className="flex items-center gap-3 h-8">
          <Separator orientation="vertical" />
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-foreground">{user.name}</p>
            <p className="text-[10px] text-muted-foreground">{user.role}</p>
          </div>
          <div
            className="size-8 rounded-full bg-muted flex items-center justify-center text-foreground text-xs font-bold border select-none"
            title={`${user.name} (${user.role})`}
            aria-label={`${user.name} (${user.role})`}
          >
            {user.avatarInitials}
          </div>
        </div>
      </div>
    </header>
  );
};
