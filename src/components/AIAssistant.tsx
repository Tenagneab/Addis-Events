import React, { useState } from "react";
import { Sparkles, MessageSquare, Search, ArrowRight, CornerDownRight, X, AlertCircle } from "lucide-react";
import { AISearchResult } from "../types";

interface AIAssistantProps {
  onSearchApply: (aiResult: AISearchResult) => void;
  onSearchClear: () => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
}

export default function AIAssistant({
  onSearchApply,
  onSearchClear,
  isLoading,
  setIsLoading,
}: AIAssistantProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [chatAnswer, setChatAnswer] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const presetQueries = [
    "I want some lively Ethio-Jazz and traditional drinks this Friday or Saturday night near Kazanchis",
    "Show me tech, AI, or startup events for developers around Bole subcity",
    "Where can I find morning yoga or outdoors mountain hiking over the weekend?",
    "Show me coffee tastings, art exhibitions, or galleries in historical Piazza",
  ];

  const handleAISearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setErrorText(null);
    setQuery(searchQuery);

    try {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userQuery: searchQuery }),
      });

      const body = await response.json();
      if (body.success && body.data) {
        setChatAnswer(body.data.chatResponse);
        onSearchApply(body.data);
      } else {
        setErrorText(body.error || "The AI Matchmaking advisor could not parse your query.");
      }
    } catch (err: any) {
      setErrorText("Ensure your GEMINI_API_KEY is configured in Settings > Secrets. Otherwise, please try again soon.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAISearch = () => {
    setQuery("");
    setChatAnswer(null);
    setErrorText(null);
    onSearchClear();
  };

  return (
    <div className="relative rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/70 via-amber-50/20 to-white p-5 shadow-sm">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm ring-4 ring-amber-100">
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-slate-800 text-base leading-none">
              AI Addis Guide & Event Matchmaker
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Let our intelligent concierge find exact matches for your mood and location.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm border border-amber-200 hover:bg-amber-100 transition-colors"
          id="btn-toggle-ai"
        >
          {isOpen ? "Hide Presets ✕" : "Browse Ideas 🧭"}
        </button>
      </div>

      {/* Main Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAISearch(query);
        }}
        className="mt-4 flex gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Traditional Ethio-Jazz on weekends around Kazanchis or networking in Bole..."
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-xs font-medium text-slate-800 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            disabled={isLoading}
            id="ai-query-input"
          />
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="flex items-center gap-1 rounded-xl bg-amber-500 text-white px-4 py-2 text-xs font-bold leading-none shadow-md transition-all hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
          id="btn-submit-ai-search"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              Advise Me
              <ArrowRight className="h-3 w-3" />
            </>
          )}
        </button>
      </form>

      {/* Preset Suggestions */}
      {isOpen && (
        <div className="mt-4 border-t border-amber-100/60 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Ask our guide or matchmaker instantly:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {presetQueries.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAISearch(q)}
                disabled={isLoading}
                className="text-left rounded-xl bg-white border border-slate-100 p-2.5 text-[11px] font-medium text-slate-600 transition-all hover:border-amber-300 hover:bg-amber-50/30 hover:shadow-sm"
                id={`preset-query-${idx}`}
              >
                <div className="flex gap-1.5 items-start">
                  <CornerDownRight className="h-3 w-3 shrink-0 text-amber-500 mt-0.5" />
                  <span>{q}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Output block */}
      {errorText && (
        <div className="mt-3.5 flex items-start gap-2 rounded-xl bg-red-50 p-3 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-red-800">Connection Reminder</p>
            <p className="text-[10.5px] text-red-600 leading-relaxed mt-0.5">{errorText}</p>
          </div>
        </div>
      )}

      {/* AI Answer bubble chat block */}
      {chatAnswer && (
        <div className="mt-4 rounded-2xl bg-slate-900 text-white p-4 shadow-xl border border-slate-800 relative overflow-hidden">
          {/* Subtle design element */}
          <div className="absolute right-[-24px] bottom-[-24px] h-24 w-24 bg-amber-500/10 rounded-full blur-xl" />

          <div className="flex items-start gap-2 bg-slate-950/40 p-1.5 rounded-lg mb-2">
            <MessageSquare className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
              Concierge Recommendation Result:
            </span>
          </div>
          <p className="text-xs font-sans leading-relaxed text-slate-100 italic">
            "{chatAnswer}"
          </p>

          <div className="mt-3.5 flex items-center justify-between border-t border-slate-800 pt-3">
            <span className="text-[10px] text-amber-400 font-bold">
              ⚡ Event listing highlights sorted by match strength below!
            </span>
            <button
              onClick={clearAISearch}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white"
              id="btn-clear-ai"
            >
              <X className="h-3.5 w-3.5" />
              Clear Matches
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
