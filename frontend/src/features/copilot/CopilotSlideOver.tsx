import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { copilotApi } from '../../api/copilot';
import { CitationItem } from '../../api/types';
import { CitationBadge } from './CitationBadge';
import { CopilotChatInput } from './CopilotChatInput';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Sparkles,
  X,
  Bot,
  User,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  citations?: CitationItem[];
  isGrounded?: boolean;
  timestamp: string;
}

interface CopilotSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  caseId?: string;
  vendorName?: string;
}

export const CopilotSlideOver: React.FC<CopilotSlideOverProps> = ({
  isOpen,
  onClose,
  caseId,
  vendorName,
}) => {
  const location = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello, I am AutonoSource Procurement Copilot. Ask me about statutory Indian regulations, CDSCO Schedule M GMP requirements, WHO TRS 1025 cold chain rules, or specific findings in this procurement case.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load contextual starter questions when route changes
  useEffect(() => {
    async function loadSuggestions() {
      try {
        const questions = await copilotApi.getSuggestedQuestions(location.pathname);
        setSuggestedQuestions(questions);
      } catch (err) {
        console.error('Failed to load copilot suggestions', err);
      }
    }
    loadSuggestions();
  }, [location.pathname]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen && typeof messagesEndRef.current?.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (queryText: string) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Extract caseId from route if not explicitly passed
      const match = location.pathname.match(/\/review\/([A-Za-z0-9_-]+)/);
      const activeCaseId = caseId || (match ? match[1] : undefined);

      const response = await copilotApi.askCopilot({
        query: queryText,
        caseId: activeCaseId,
        vendorName: vendorName,
        currentRoute: location.pathname,
      });

      const assistantMsg: ChatMessage = {
        id: `assist-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        citations: response.citations,
        isGrounded: response.isGrounded,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (response.suggestedQueries && response.suggestedQueries.length > 0) {
        setSuggestedQuestions(response.suggestedQueries);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, an error occurred while connecting to the regulatory intelligence engine. Please try again.',
        isGrounded: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: 'Chat history cleared. How can I assist with your procurement review or statutory due diligence?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-foreground">Ask AutonoSource</h2>
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30 bg-emerald-950/20 px-1.5 py-0">
                  Grounded
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate max-w-[240px]">
                {location.pathname.includes('review')
                  ? `Context: Case Audit Review`
                  : `Route: ${location.pathname}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClear}
              title="Clear chat history"
              className="size-8 rounded-full text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="size-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-xl p-3 space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                    : 'bg-muted/40 border border-border/60 text-foreground rounded-tl-none'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>

                {/* Citations section */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-border/40">
                    <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                      <BookOpen className="size-3 text-primary" />
                      Statutory & Evidence Citations:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {msg.citations.map((c, i) => (
                        <CitationBadge key={i} citation={c} />
                      ))}
                    </div>
                  </div>
                )}

                <span className="block text-[9px] opacity-60 text-right">{msg.timestamp}</span>
              </div>

              {msg.sender === 'user' && (
                <div className="size-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 mt-0.5">
                  <User className="size-3.5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="size-3.5" />
              </div>
              <div className="rounded-xl p-3 bg-muted/40 border border-border/60 text-foreground rounded-tl-none flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary animate-pulse" />
                <div className="size-2 rounded-full bg-primary animate-pulse delay-150" />
                <div className="size-2 rounded-full bg-primary animate-pulse delay-300" />
                <span className="text-[11px] text-muted-foreground ml-1">
                  Cross-referencing CDSCO & Qdrant...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer input form */}
        <div className="p-4 border-t border-border bg-card/60 shrink-0">
          <CopilotChatInput
            onSend={handleSend}
            isLoading={isLoading}
            suggestedQuestions={suggestedQuestions}
          />
        </div>
      </div>
    </div>
  );
};
