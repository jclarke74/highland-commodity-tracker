"use client";

import { Lightbulb } from "lucide-react";

interface InsightSnippetProps {
  text: string;
  onViewAll: () => void;
}

export function InsightSnippet({ text, onViewAll }: InsightSnippetProps) {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/30 rounded-lg p-4 min-w-[240px] flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="size-4 text-primary" />
          <span className="text-[11px] font-semibold tracking-widest uppercase text-primary">
            Insight
          </span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{text}</p>
      </div>
      <button
        onClick={onViewAll}
        className="text-sm text-primary hover:text-primary/80 font-medium mt-3 text-left transition-colors cursor-pointer"
      >
        View all insights &rarr;
      </button>
    </div>
  );
}
