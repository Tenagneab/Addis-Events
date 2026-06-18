import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { PlusCircle, Sparkles, AlertCircle, Edit, Trash2, Key, HelpCircle, RefreshCw, X, Check } from "lucide-react";
import { EventItem, AICopywriterResult } from "../types";

interface PublisherPanelProps {
  events: EventItem[];
  onCreateEvent: (newEvent: Omit<EventItem, "id" | "rsvpCount">) => void;
  onUpdateEvent: (updatedEvent: EventItem) => void;
  onDeleteEvent: (eventId: string) => void;
  isCreatorMode: boolean;
  setIsCreatorMode: (val: boolean) => void;
}

export default function PublisherPanel({
  events,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  isCreatorMode,
  setIsCreatorMode,
}: PublisherPanelProps) {
  // Authentication passcode state
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Concerts & Music");
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [tagsInput, setTagsInput] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [hostName, setHostName] = useState("");

  // AI assistant enhancements
  const [rawAIScribble, setRawAIScribble] = useState("");
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiSuccessMsg, setAiSuccessMsg] = useState("");

  const DEFAULT_ORGANIZER_PASSCODE = "addis2026";

  // Handle password submit
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.toLowerCase() === DEFAULT_ORGANIZER_PASSCODE) {
      setIsCreatorMode(true);
      setAuthError("");
    } else {
      setAuthError("Invalid Organizer Passcode. Reach out to portal administrator.");
    }
  };

  const handleSignOut = () => {
    setIsCreatorMode(false);
    setPasscode("");
  };

  // Preset Unsplash options for easy banner selection
  const BANNER_PRESETS = [
    { name: "Live Music / Concert", url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=850&auto=format&fit=crop&q=80" },
    { name: "Art & Exhibition Gallery", url: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=850&auto=format&fit=crop&q=80" },
    { name: "Tech Summit & Meetup", url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=850&auto=format&fit=crop&q=80" },
    { name: "Outdoor Hiking & Nature", url: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=850&auto=format&fit=crop&q=80" },
    { name: "Food tasting / Social lounge", url: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=850&auto=format&fit=crop&q=80" }
  ];

  const handleApplyPresetBanner = (url: string) => {
    setBannerUrl(url);
  };

  // Launch the AI Copywriter optimization tool
  const handleAICopywriterFormOptimize = async () => {
    if (!rawAIScribble.trim()) {
      setAiError("Please type a quick scribble about your event details first.");
      return;
    }

    setIsAILoading(true);
    setAiError("");
    setAiSuccessMsg("");

    try {
      const response = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawAIScribble }),
      });

      const body = await response.json();
      if (body.success && body.data) {
        const aiResult: AICopywriterResult = body.data;
        setTitle(aiResult.title || "");
        setCategory(aiResult.category || "Concerts & Music");
        setDescription(aiResult.description || "");
        if (Array.isArray(aiResult.tags)) {
          setTagsInput(aiResult.tags.join(", "));
        }
        setAiSuccessMsg("Gemini AI successfully auto-filled the title, category, tags, and description! 🎉");
      } else {
        setAiError(body.error || "The AI Enhancer could not parse your inputs. Try again.");
      }
    } catch (err) {
      setAiError("Connection to AI services failed. Make sure your local GEMINI_API_KEY is configured.");
      console.error(err);
    } finally {
      setIsAILoading(false);
    }
  };

  // Switch to Editing view
  const handleEditClick = (event: EventItem) => {
    setIsEditing(event.id);
    setTitle(event.title);
    setCategory(event.category);
    setDateTime(event.dateTime);
    setLocation(event.location);
    setDescription(event.description);
    setPrice(event.price);
    setTagsInput(event.tags.join(", "));
    setBannerUrl(event.bannerUrl || "");
    setHostName(event.hostName);
    setIsFormOpen(true);
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !category || !dateTime || !location || !hostName) {
      alert("Please fill in all mandatory event coordinates.");
      return;
    }

    const processedTags = tagsInput
      .split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const formattedPayload = {
      title,
      category,
      dateTime,
      location,
      description: description || "Join us for this exciting local gathering!",
      price: Number(price) || 0,
      tags: processedTags,
      bannerUrl: bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60",
      hostName,
    };

    if (isEditing) {
      onUpdateEvent({
        ...formattedPayload,
        id: isEditing,
        rsvpCount: events.find(e => e.id === isEditing)?.rsvpCount || 0
      });
    } else {
      onCreateEvent(formattedPayload);
    }

    // Reset Form fields
    resetForm();
  };

  const resetForm = () => {
    setIsEditing(null);
    setTitle("");
    setCategory("Concerts & Music");
    setDateTime("");
    setLocation("");
    setDescription("");
    setPrice(0);
    setTagsInput("");
    setBannerUrl("");
    setHostName("");
    setRawAIScribble("");
    setAiError("");
    setAiSuccessMsg("");
    setIsFormOpen(false);
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" id="publisher-root">
      {/* 1. Unauthorized Screen */}
      {!isCreatorMode ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-500 border border-slate-200 shadow-inner">
            <Key className="h-5 w-5" />
          </div>
          <h3 className="mt-3 font-display font-semibold text-slate-800 text-sm">
            Event Host & Publisher Hub
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-sm leading-relaxed">
            Are you an event organizer, business owner, or cultural curator? Enter your passcode below to publish and manage listings in the Addis Ababa community directory.
          </p>

          <form onSubmit={handleAuthSubmit} className="mt-5 w-full max-w-xs space-y-3">
            <div>
              <input
                type="password"
                placeholder="Enter Organizer Passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-center text-xs font-semibold tracking-wider text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                id="organizer-passcode-input"
              />
              <p className="mt-1.5 text-[9.5px] text-slate-400 font-mono">
                Hint: Type <span className="font-bold text-amber-600 font-mono underline">addis2026</span> to unlock the creator features.
              </p>
            </div>

            {authError && (
              <p className="text-[10.5px] font-medium text-red-600 leading-tight">
                ⚠️ {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-slate-900 border border-slate-950 py-2.5 text-xs font-bold text-white shadow hover:bg-slate-800 transition-colors"
              id="btn-passcode-unlock"
            >
              Sign In to Creator Suite
            </button>
          </form>
        </div>
      ) : (
        /* 2. Authorized Creator Suite Dashboard */
        <div className="space-y-6">
          {/* Dashboard Header toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[9.5px] font-bold text-emerald-800 tracking-wider uppercase">
                Creator Mode Active
              </span>
              <h3 className="mt-1.5 font-display font-bold text-slate-800 text-base leading-none">
                Organizer Event Dashboard
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 text-white px-4 py-2 text-xs font-bold leading-none shadow hover:bg-amber-600 transition-colors"
                id="btn-open-form"
              >
                <PlusCircle className="h-4 w-4" />
                {isFormOpen ? "Close Form" : "Create New Event"}
              </button>
              <button
                onClick={handleSignOut}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                id="btn-sign-out"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Create/Edit Form Box */}
          {isFormOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-100/80 bg-slate-50 p-5 space-y-5"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-xs font-bold tracking-wide text-slate-800 uppercase flex items-center gap-1">
                  <PlusCircle className="h-4 w-4 text-amber-500" />
                  {isEditing ? "Modify Event Listing" : "Create New Addis Ababa Event"}
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-slate-400 hover:text-slate-600"
                  title="Cancel Edit"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Gemini Smart AI Copywriter section helper */}
              {!isEditing && (
                <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                    <span className="text-xs font-bold text-amber-900 leading-none">
                      Gemini Copilot Tool (Auto-Copywriter helper)
                    </span>
                  </div>
                  <p className="text-[10.5px] text-amber-800 leading-relaxed">
                    Scribble the raw coordinates below (e.g. "hiphop gig on friday night at bole atlas cafe, 200 birr tag, starts 8pm") and click 'AI Filled draft'.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={rawAIScribble}
                      onChange={(e) => setRawAIScribble(e.target.value)}
                      placeholder="e.g. classical guitar recital this Wednesday at Alliance, tickets 150, coffee included..."
                      className="flex-1 rounded-lg border border-amber-200 bg-white py-1.5 px-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      id="ai-scribe-input"
                    />
                    <button
                      type="button"
                      disabled={isAILoading || !rawAIScribble.trim()}
                      onClick={handleAICopywriterFormOptimize}
                      className="flex items-center gap-1 rounded-lg bg-amber-500 text-white px-3 text-xs font-bold shadow hover:bg-amber-600 disabled:bg-slate-300 disabled:cursor-not-allowed"
                      id="btn-ai-enhance-form"
                    >
                      {isAILoading ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          AI Auto-Fill
                        </>
                      )}
                    </button>
                  </div>
                  {aiError && (
                    <div className="text-[10px] text-red-600 font-semibold">{aiError}</div>
                  )}
                  {aiSuccessMsg && (
                    <div className="text-[10.5px] text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> {aiSuccessMsg}
                    </div>
                  )}
                </div>
              )}

              {/* Main Submit Form parameters layout */}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* 1. Title */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter interactive catchword title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 focus:border-amber-500 focus:outline-none"
                    id="form-title"
                  />
                </div>

                {/* 2. Category & Date/Time block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Event Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 focus:border-amber-500 focus:outline-none"
                      id="form-category"
                    >
                      <option>Concerts & Music</option>
                      <option>Art & Exhibitions</option>
                      <option>Networking & Tech</option>
                      <option>Food & Culture</option>
                      <option>Outdoors & Sports</option>
                      <option>Theater & Film</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Date & Timestamps <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={dateTime}
                      onChange={(e) => setDateTime(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 focus:border-amber-500 focus:outline-none"
                      id="form-datetime"
                    />
                  </div>
                </div>

                {/* 3. Location Description & Admission ticket price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Location / Venue in Addis Ababa <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alliance Ethio-Française, Piazza"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 focus:border-amber-500 focus:outline-none"
                      id="form-location"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Admission Fee (Ethiopian Birr - type 0 for Free)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 350"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 focus:border-amber-500 focus:outline-none"
                      id="form-price"
                    />
                  </div>
                </div>

                {/* 4. Description Text block */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Event Description & Itinerary <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide details about the dynamic activities or ticket reservations guidelines..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 focus:border-amber-500 focus:outline-none"
                    id="form-description"
                  />
                </div>

                {/* 5. Hostname & Text Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Host Name / Sponsor Curators <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tomoca Coffee Management"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 focus:border-amber-500 focus:outline-none"
                      id="form-hostname"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Search Tagwords (comma-separated list)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Jazz, Piazza, Tomoca, Weekend"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-2.5 focus:border-amber-500 focus:outline-none"
                      id="form-tags"
                    />
                  </div>
                </div>

                {/* 6. Custom Banner Image link */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Banner Background Image URL (Leave empty for beautiful category defaults)
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/your-image"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 focus:border-amber-500 focus:outline-none"
                    id="form-banner"
                    referrerPolicy="no-referrer"
                  />

                  {/* Visual helper thumbnails selection presets */}
                  <div className="mt-2.5">
                    <p className="text-[10px] text-slate-400 font-semibold mb-1">
                      Or select one of our premium preset categories banner backgrounds:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {BANNER_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyPresetBanner(p.url)}
                          className={`rounded-md border py-0.5 px-2 text-[9px] font-medium transition-all ${
                            bannerUrl === p.url
                              ? "bg-amber-100 border-amber-300 text-amber-800"
                              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                          }`}
                          id={`banner-preset-${idx}`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions bottom container */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 font-bold hover:bg-slate-100 transition-colors"
                    id="btn-form-cancel"
                  >
                    Discard Draft
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 border border-slate-950 px-5 py-1.5 font-bold text-white shadow hover:bg-slate-800 transition-colors"
                    id="btn-form-submit"
                  >
                    {isEditing ? "Save & Publish Update" : "Publish Event Active"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Quick Stats list item table */}
          <div>
            <h4 className="font-display font-semibold text-slate-800 text-xs uppercase tracking-wider mb-2.5">
              Active Listings Managed By You ({events.length})
            </h4>

            {events.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                You haven't posted any events yet. Start by creating an event using the creator panel!
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-150">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <th className="p-3">Title & Venue</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Pricing details</th>
                      <th className="p-3">Bookings (RSVP)</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {events.map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <p className="font-semibold text-slate-950 max-w-[180px] truncate">{evt.title}</p>
                          <p className="text-[10px] text-slate-400 capitalize truncate">{evt.location}</p>
                        </td>
                        <td className="p-3">{evt.category}</td>
                        <td className="p-3 font-semibold text-slate-800">
                          {evt.price === 0 ? "Free Entrance" : `${evt.price} Birr`}
                        </td>
                        <td className="p-3">
                          <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 font-bold font-mono">
                            {evt.rsvpCount || 0} RSVPs Booked
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleEditClick(evt)}
                              className="text-amber-600 hover:text-amber-800 p-1 bg-amber-50 rounded"
                              title="Edit listing details"
                              id={`admin-edit-row-${evt.id}`}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => onDeleteEvent(evt.id)}
                              className="text-red-500 hover:text-red-700 p-1 bg-red-50 rounded"
                              title="Delete listing completely"
                              id={`admin-delete-row-${evt.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
