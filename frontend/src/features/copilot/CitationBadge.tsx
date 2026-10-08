import React, { useState } from 'react';
import { CitationItem } from '../../api/types';
import { Badge } from '../../components/ui/badge';
import { BookOpen, ExternalLink, X } from 'lucide-react';

interface CitationBadgeProps {
  citation: CitationItem;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({ citation }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer text-left mr-1.5 my-1"
        title="Click to inspect citation excerpt"
      >
        <BookOpen className="size-3 shrink-0" />
        <span className="truncate max-w-[180px]">{citation.title}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
              <div>
                <span className="font-mono text-[10px] text-primary uppercase font-bold tracking-wider">
                  {citation.id}
                </span>
                <h3 className="font-bold text-sm text-foreground mt-0.5">{citation.title}</h3>
                <p className="text-xs text-muted-foreground">{citation.source}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border/50 text-xs text-foreground leading-relaxed font-mono">
              "{citation.excerpt}"
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
              >
                Close Citation
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
