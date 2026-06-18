import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Calendar,
  MapPin,
  Sparkles,
  Bookmark,
  PlusCircle,
  TrendingUp,
  SlidersHorizontal,
  RefreshCw,
  Info,
  CalendarDays,
  CheckCircle,
  HelpCircle,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { EventItem, EventCategory, ALL_CATEGORIES, AISearchResult } from "./types";
import EventCard from "./components/EventCard";
import AIAssistant from "./components/AIAssistant";
import PublisherPanel from "./components/PublisherPanel";

export default function App() {
  // Sync Events list from full-stack background server
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>("All Categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState<string>("All Areas");
  const [priceRange, setPriceRange] = useState<string>("any"); // "any", "free", "under500", "above500"

  // Active View Tab: "discover", "bookmarked", "publisher"
  const [activeTab, setActiveTab] = useState<"discover" | "bookmarked" | "publisher">("discover");

  // Client-Side interactions (RSVP and Bookmarks lists) stored in localStorage
  const [bookmarkIds, setBookmarkIds] = useState<string[]>([]);
  const [rsvpIds, setRsvpIds] = useState<string[]>([]);

  // AI Matches state
  const [aiMatches, setAiMatches] = useState<{ id: string; score: number; reason: string }[]>([]);
  const [isAILoading, setIsAILoading] = useState(false);

  // Organizer mode activation coordinates
  const [isCreatorMode, setIsCreatorMode] = useState(false);

  // Hardcoded key areas in Addis Ababa for explicit filtering
  const ADDIS_AREAS = [
    "All Areas",
    "Bole",
    "Kazanchis",
    "Piazza",
    "Entoto",
    "Sarbet",
    "Mexico",
    "Megenagna"
  ];

  // Fetch events from server on mount
  useEffect(() => {
    fetchEvents();

    // Restoring bookmarks & RSVPs from localStorage
    try {
      const storedBookmarks = localStorage.getItem("addis_events_bookmarks_v1");
      if (storedBookmarks) setBookmarkIds(JSON.parse(storedBookmarks));

      const storedRSVPs = localStorage.getItem("addis_events_rsvps_v1");
      if (storedRSVPs) setRsvpIds(JSON.parse(storedRSVPs));
    } catch (e) {
      console.error("Local storage restoration failed", e);
    }
  }, []);

  const fetchEvents = async () => {
    setIsLoading(true);
    setErrorText(null);
    try {
      const response = await fetch("/api/events");
      const body = await response.json();
      if (body.success && Array.isArray(body.events)) {
        setEvents(body.events);
      } else {
        setErrorText("Had trouble loading current active events list.");
      }
    } catch (err) {
      setErrorText("Could not link to backend server events API. Make sure dev server is active.");
      console.error("Fetch failure", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Create Event service caller
  const handleCreateEvent = async (payload: Omit<EventItem, "id" | "rsvpCount">) => {
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (body.success && body.event) {
        setEvents((prev) => [...prev, body.event]);
        // Open discover mode immediately after posting
        setActiveTab("discover");
        // Scroll to newly published items
        setTimeout(() => {
          const banner = document.getElementById("events-grid");
          if (banner) banner.scrollIntoView({ behavior: "smooth" });
        }, 150);
      } else {
        alert(body.error || "Event listing could not be confirmed.");
      }
    } catch (err) {
      console.error("Event creation call failed", err);
      alert("Backend API connection timed out. Please retry.");
    }
  };

  // 2. Edit/Update Event coordinator
  const handleUpdateEvent = async (payload: EventItem) => {
    try {
      const response = await fetch(`/api/events/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json();
      if (body.success && body.event) {
        setEvents((prev) => prev.map((e) => (e.id === payload.id ? body.event : e)));
        setActiveTab("discover");
      } else {
        alert(body.error || "Failed to finalize listing revision.");
      }
    } catch (err) {
      console.error("Event update call failed", err);
      alert("Error saving your edits.");
    }
  };

  // 3. Delete Event coordinator
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("Are you absolutely sure you want to remove this event listing from Addis Events? All booking stats will be lost.")) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${id}`, {
        method: "DELETE",
      });

      const body = await response.json();
      if (body.success) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert(body.error || "Failed to discard selected listing.");
      }
    } catch (err) {
      console.error("Event deletion call failed", err);
    }
  };

  // 4. RSVP coordinate tracker
  const handleRSVP = async (id: string) => {
    const isAlreadyRSVPed = rsvpIds.includes(id);

    // If already RSVPed, simply show confirmation toast or simulated undo, but standard is increments!
    if (isAlreadyRSVPed) {
      // Allow them to toggle off RSVP
      const nextRSVPs = rsvpIds.filter((item) => item !== id);
      setRsvpIds(nextRSVPs);
      localStorage.setItem("addis_events_rsvps_v1", JSON.stringify(nextRSVPs));
      return;
    }

    try {
      const response = await fetch(`/api/events/${id}/rsvp`, {
        method: "POST",
      });

      const body = await response.json();
      if (body.success) {
        setEvents((prev) =>
          prev.map((e) => (e.id === id ? { ...e, rsvpCount: body.rsvpCount } : e))
        );

        const nextRSVPs = [...rsvpIds, id];
        setRsvpIds(nextRSVPs);
        localStorage.setItem("addis_events_rsvps_v1", JSON.stringify(nextRSVPs));
      }
    } catch (err) {
      console.error("RSVP endpoint failure", err);
    }
  };

  // 5. Bookmarks toggler
  const handleBookmarkToggle = (id: string) => {
    const isBookmarked = bookmarkIds.includes(id);
    let nextBookmarks: string[];

    if (isBookmarked) {
      nextBookmarks = bookmarkIds.filter((item) => item !== id);
    } else {
      nextBookmarks = [...bookmarkIds, id];
    }

    setBookmarkIds(nextBookmarks);
    localStorage.setItem("addis_events_bookmarks_v1", JSON.stringify(nextBookmarks));
  };

  // AI Match apply helper
  const handleAISearchApply = (aiData: AISearchResult) => {
    setAiMatches(aiData.recommendations || []);
  };

  const handleAISearchClear = () => {
    setAiMatches([]);
  };

  // Clean-up and join local settings on current events array representation
  const enrichedEvents: EventItem[] = events.map((event) => {
    const match = aiMatches.find((m) => m.id === event.id);
    return {
      ...event,
      clientBookmarked: bookmarkIds.includes(event.id),
      clientRSVPed: rsvpIds.includes(event.id),
      matchScore: match ? match.score : undefined,
      matchReason: match ? match.reason : undefined,
    };
  });

  // Sort events so that AI High Match Scores bubble up to the top!
  const sortedEvents = [...enrichedEvents].sort((a, b) => {
    if (a.matchScore !== undefined && b.matchScore !== undefined) {
      return b.matchScore - a.matchScore;
    }
    if (a.matchScore !== undefined) return -1;
    if (b.matchScore !== undefined) return 1;

    // Default: Sort by proximity date (ascending)
    return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
  });

  // Applying standard user search filtering values
  const filteredEvents = sortedEvents.filter((item) => {
    // 1. Filter by Active Tab Bookmark toggle
    if (activeTab === "bookmarked" && !item.clientBookmarked) {
      return false;
    }

    // 2. Category filtering
    if (selectedCategory !== "All Categories" && item.category !== selectedCategory) {
      return false;
    }

    // 3. Subcity/Area filtering
    if (selectedArea !== "All Areas") {
      const areaKeyword = selectedArea.toLowerCase();
      const inLocation = item.location.toLowerCase().includes(areaKeyword);
      const inTitle = item.title.toLowerCase().includes(areaKeyword);
      const inDescription = item.description.toLowerCase().includes(areaKeyword);
      const inTags = item.tags.some((tag) => tag.toLowerCase().includes(areaKeyword));

      if (!inLocation && !inTitle && !inDescription && !inTags) {
        return false;
      }
    }

    // 4. Text search query (title, host, tags, area)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDescription = item.description.toLowerCase().includes(q);
      const matchHost = item.hostName.toLowerCase().includes(q);
      const matchTags = item.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchLocation = item.location.toLowerCase().includes(q);

      if (!matchTitle && !matchDescription && !matchHost && !matchTags && !matchLocation) {
        return false;
      }
    }

    // 5. Price filtering
    if (priceRange === "free" && item.price !== 0) {
      return false;
    }
    if (priceRange === "under500" && (item.price === 0 || item.price > 500)) {
      return false;
    }
    if (priceRange === "above500" && item.price <= 500) {
      return false;
    }

    return true;
  });

  // Count active stats
  const activeEventsCount = events.length;
  const userRSVPsCount = enrichedEvents.filter((e) => e.clientRSVPed).length;
  const userBookmarksCount = bookmarkIds.length;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-800 font-sans antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Dynamic Upper Ethiopian Cultural ribbon accent */}
      <div className="h-1.5 w-full flex">
        <div className="h-full flex-1 bg-red-600" />
        <div className="h-full flex-1 bg-yellow-400" />
        <div className="h-full flex-1 bg-green-600" />
      </div>

      {/* Main Top Header Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Round cultural abstract logo icon */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-emerald-600 p-[2px] shadow-md">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-white text-xs font-black">
                🇪🇹
              </div>
            </div>
            <div>
              <h1 className="font-display font-extrabold text-lg text-slate-950 tracking-tight leading-none">
                AddisEvents
              </h1>
              <p className="text-[10px] uppercase font-bold text-amber-600 tracking-wider mt-1 font-mono">
                Cultural & Tech Portal
              </p>
            </div>
          </div>

          {/* Tab Selection */}
          <nav className="flex items-center gap-1 bg-slate-100/80 rounded-xl p-1">
            <button
              onClick={() => {
                setActiveTab("discover");
                handleAISearchClear();
              }}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold leading-none transition-all ${
                activeTab === "discover"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Discover
            </button>
            <button
              onClick={() => setActiveTab("bookmarked")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold leading-none transition-all flex items-center gap-1 ${
                activeTab === "bookmarked"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Bookmark className="h-3 w-3 fill-current" />
              Saved ({userBookmarksCount})
            </button>
            <button
              onClick={() => setActiveTab("publisher")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold leading-none transition-all flex items-center gap-1.5 ${
                activeTab === "publisher"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-amber-700 hover:bg-amber-100/50"
              }`}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              {isCreatorMode ? "Hosting Center" : "Host Login"}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Visual Intro Header */}
      {activeTab === "discover" && (
        <section className="relative bg-slate-950 text-white py-14 overflow-hidden shadow-inner shrink-0">
          {/* Ambient blurred colorful vector points */}
          <div className="absolute top-1/4 left-1/4 h-56 w-56 rounded-full bg-amber-500/20 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 select-none">
            <div className="max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/35 px-3 py-1 text-xs font-bold tracking-wide text-amber-400">
                <CalendarDays className="h-3.5 w-3.5" />
                Live Addis Ababa Directory • 2026
              </span>
              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-white tracking-tight leading-none">
                Experience Addis Ababa's Vibrant Agenda
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed max-w-lg">
                Stay connected to modern art galeris, live ethio-jazz concerts, start-up launch mixers, and outdoor mountain expeditions happening in Ethiopia’s capital.
              </p>

              {/* Ticker status values */}
              <div className="pt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-400 font-mono">
                <span className="flex items-center gap-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  ⚡ {activeEventsCount} Active Listings
                </span>
                <span className="flex items-center gap-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                  🎟️ {userRSVPsCount} Active Bookings
                </span>
                <span className="flex items-center gap-1 bg-slate-900/60 p-2 rounded-lg border border-slate-800 animate-pulse">
                  🟢 Central Time Grid Verified
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Body Grid */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
        {/* 1. DISCOVER VIEW */}
        {activeTab === "discover" && (
          <>
            {/* AI Assistant container Box */}
            <AIAssistant
              onSearchApply={handleAISearchApply}
              onSearchClear={handleAISearchClear}
              isLoading={isAILoading}
              setIsLoading={setIsAILoading}
            />

            {/* Standard Category Chips Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                  Filter Event Categories
                </h3>
                {aiMatches.length > 0 && (
                  <button
                    onClick={handleAISearchClear}
                    className="text-xs font-bold text-amber-600 hover:text-amber-800 underline flex items-center gap-1"
                  >
                    Reset AI Search MATCHES
                  </button>
                )}
              </div>

              {/* Horizontal scrollable categories flow */}
              <div className="flex flex-wrap gap-2 pt-1">
                {ALL_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                    }}
                    className={`rounded-xl px-4 py-2 text-xs font-bold transition-all border ${
                      selectedCategory === cat
                        ? "bg-slate-900 text-white border-slate-950 shadow"
                        : "bg-white text-slate-600 border-slate-150 hover:bg-slate-50"
                    }`}
                    id={`cat-chip-${cat.replace(/\s+/g, "-")}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Multi-Filter parameters block */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 rounded-2xl border border-slate-150 bg-slate-50/50 p-4">
                {/* Search Text input */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Search keywords, hosts, tags
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Tomoca, Jazz, Bole..."
                      className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-3 text-xs focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                      id="text-search-filter"
                    />
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Area filter */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Addis area / subcity
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    id="area-select-filter"
                  >
                    {ADDIS_AREAS.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Admission price Range filter */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    Admission Cost
                  </label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-semibold focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    id="price-range-filter"
                  >
                    <option value="any">Any Price</option>
                    <option value="free">Free Entrance Only</option>
                    <option value="under500">Under 500 Birr</option>
                    <option value="above500">Above 500 Birr</option>
                  </select>
                </div>

                {/* Trigger Reset button */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All Categories");
                      setSelectedArea("All Areas");
                      setPriceRange("any");
                      handleAISearchClear();
                    }}
                    className="w-full rounded-xl border border-slate-250 bg-white py-2 px-4 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100"
                    id="btn-reset-filters"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Event List / Grid display */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-extrabold text-slate-900 text-xl tracking-tight">
                  {aiMatches.length > 0 ? "Sorted by AI Recommendation Match Strength" : "Upcoming events in Addis Ababa"}
                </h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-600">
                  {filteredEvents.length} active matching listings found
                </span>
              </div>

              {/* Loader indicator state */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <RefreshCw className="h-8 w-8 text-amber-500 animate-spin" />
                  <p className="mt-4 text-sm font-semibold text-slate-600">
                    Syncing live Addis listings...
                  </p>
                </div>
              ) : errorText ? (
                /* Fallback error container */
                <div className="rounded-2xl border border-red-150 bg-red-50/50 p-8 text-center text-xs space-y-4">
                  <AlertCircle className="mx-auto h-8 w-8 text-red-600 animate-bounce" />
                  <div>
                    <p className="font-bold text-red-800 text-sm">Offline mode warning</p>
                    <p className="text-red-600 mt-1 max-w-md mx-auto leading-relaxed">{errorText}</p>
                  </div>
                  <button
                    onClick={fetchEvents}
                    className="rounded-lg bg-red-100 text-red-800 px-4 py-2 font-bold hover:bg-red-200"
                  >
                    Retry Connection
                  </button>
                </div>
              ) : filteredEvents.length === 0 ? (
                /* No Results container */
                <div className="rounded-3xl border border-dashed border-slate-200 py-20 px-4 text-center max-w-xl mx-auto space-y-4">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-400 border border-slate-200">
                    🔍
                  </div>
                  <div>
                    <h4 className="font-display font-semibold text-slate-800 text-sm">
                      No matching events found
                    </h4>
                    <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                      We couldn't locate active events matching your filter selections. Try broadening your criteria, selecting another area subcity, or clearing the AI Match Advisor.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("All Categories");
                      setSelectedArea("All Areas");
                      setPriceRange("any");
                      handleAISearchClear();
                    }}
                    className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
                    id="btn-clear-no-results"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                /* Infinite events cards grid container */
                <motion.div
                  layoutId="events-grid-layout"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  id="events-grid"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredEvents.map((evt) => (
                      <EventCard
                        key={evt.id}
                        event={evt}
                        onRSVP={handleRSVP}
                        onBookmark={handleBookmarkToggle}
                        isCreatorMode={isCreatorMode}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
          </>
        )}

        {/* 2. SAVED / BOOKMARKED VIEW */}
        {activeTab === "bookmarked" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-display font-extrabold text-slate-950 text-2xl tracking-tight">
                Your Saved Addis Agenda Bookmarks
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                A personal curation of events you bookmarked or RSVP'ed. These items stay saved in your browser's local cache.
              </p>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 p-16 text-center max-w-sm mx-auto space-y-4">
                <Bookmark className="h-8 w-8 text-slate-300 mx-auto" />
                <div>
                  <p className="font-display font-semibold text-slate-800 text-sm">Bookmarks empty</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Select the bookmark ribbons on our discover tab to save events and build your upcoming calendar agenda!
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("discover")}
                  className="rounded-xl bg-slate-900 text-white py-1.5 px-4 text-xs font-bold hover:bg-slate-800"
                >
                  Explore Event Listings
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredEvents.map((evt) => (
                    <EventCard
                      key={evt.id}
                      event={evt}
                      onRSVP={handleRSVP}
                      onBookmark={handleBookmarkToggle}
                      isCreatorMode={isCreatorMode}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}

        {/* 3. PUBLISHER HOUSING PANEL VIEW */}
        {activeTab === "publisher" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-slate-950 text-2xl tracking-tight">
                  Hosting & Event Publisher Panel
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Secure area for coordinators to post, delete, edit, or manage active listings.
                </p>
              </div>
            </div>

            <PublisherPanel
              events={events}
              onCreateEvent={handleCreateEvent}
              onUpdateEvent={handleUpdateEvent}
              onDeleteEvent={handleDeleteEvent}
              isCreatorMode={isCreatorMode}
              setIsCreatorMode={setIsCreatorMode}
            />
          </div>
        )}
      </main>

      {/* Elegant minimalist informational footer section */}
      <footer className="bg-slate-50 border-t border-slate-100 mt-20 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p className="font-medium text-slate-400">
            © 2026 AddisEvents Inc. Empowering local host coordination & discovers. All rights reserved.
          </p>
          <div className="flex gap-4 font-semibold text-slate-400">
            <a
              href="https://www.google.com/maps/place/Addis+Ababa/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-600 transition-colors"
            >
              Addis Ababa, Ethiopia
            </a>
            <span>•</span>
            <span className="text-slate-400">
              Passcode: <span className="underline font-bold text-amber-600 font-mono">addis2026</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
