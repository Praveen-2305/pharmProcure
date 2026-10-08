import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Send, Sparkles, RefreshCw } from 'lucide-react';

interface CopilotChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  suggestedQuestions: string[];
}

export const CopilotChatInput: React.FC<CopilotChatInputProps> = ({
  onSend,
  isLoading,
  suggestedQuestions,
}) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="space-y-3 pt-2">
      {/* Suggested question chips */}
      {suggestedQuestions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
            <Sparkles className="size-3 text-amber-400" />
            Suggested Audit Queries:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                disabled={isLoading}
                onClick={() => onSend(q)}
                className="text-left text-[11px] px-2.5 py-1 rounded-lg bg-muted/40 hover:bg-muted border border-border/50 text-foreground/80 hover:text-foreground transition-colors leading-tight"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main input form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Ask about CDSCO laws, cold-chain SLAs, pricing..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="text-xs bg-background/80"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!input.trim() || isLoading}
          className="shrink-0 h-9 px-3 gap-1.5 bg-primary text-primary-foreground font-semibold"
        >
          {isLoading ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : (
            <>
              <Send className="size-3.5" />
              <span>Ask</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
