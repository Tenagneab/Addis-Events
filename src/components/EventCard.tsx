import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, MapPin, User, Ticket, Bookmark, Trash2, Edit, Check, Share2, AlertTriangle, Clock } from "lucide-react";
import { EventItem } from "../types";

interface EventCardProps {
  key?: string | number;
  event: EventItem;
  onRSVP: (eventId: string) => void | Promise<void>;
  onBookmark: (eventId: string) => void | Promise<void>;
  onEdit?: (event: EventItem) => void;
  onDelete?: (eventId: string) => void;
  isCreatorMode: boolean;
}

export default function EventCard({
  event,
  onRSVP,
  onBookmark,
  onEdit,
  onDelete,
  isCreatorMode,
}: EventCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Formatter for human dates
  const formatEventDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatEventTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(
      `${event.title} at ${event.location} on ${formatEventDate(event.dateTime)}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`group relative overflow-hidden rounded-2xl border bg-white transition-all shadow-sm hover:translate-y-[-2px] hover:shadow-md ${
          event.isCanceled ? "opacity-75 border-gray-200" : "border-gray-100"
        }`}
        id={`event-card-${event.id}`}
      >
        {/* Banner Image */}
        <div className="relative h-44 w-full overflow-hidden bg-gray-50">
          <img
            src={event.bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60"}
            alt={event.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />

          {/* Blur overlay if canceled */}
          {event.isCanceled && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
              <span className="flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-semibold tracking-wide text-white animate-pulse uppercase">
                <AlertTriangle className="h-3.5 w-3.5" />
                Canceled
              </span>
            </div>
          )}

          {/* AI Recommender Match Score badge */}
          {event.matchScore !== undefined && event.matchScore > 10 && (
            <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm ring-2 ring-white animate-bounce">
              <span>★</span> {event.matchScore}% Match
            </div>
          )}

          {/* Pricing tag */}
          <div className="absolute top-3 right-3 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
            {event.price === 0 ? "FREE" : `${event.price} Birr`}
          </div>

          {/* Category overlay */}
          <span className="absolute bottom-3 left-3 rounded-md bg-white/90 px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-800 uppercase shadow-sm">
            {event.category}
          </span>
        </div>

        {/* Card Body */}
        <div className="p-5">
          {/* Header Metadata */}
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-amber-600">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatEventDate(event.dateTime)}
            </span>
            <span className="flex items-center gap-1 font-mono text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              {formatEventTime(event.dateTime)}
            </span>
          </div>

          {/* Title */}
          <h3 className="line-clamp-1 font-display text-lg font-bold text-slate-900 transition-colors group-hover:text-amber-600">
            {event.title}
          </h3>

          {/* Location */}
          <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{event.location}</span>
          </p>

          {/* Description Snippet */}
          <p className="mt-3 line-clamp-2 text-xs text-slate-600 leading-relaxed">
            {event.description}
          </p>

          {/* AI recommendation explanation text overlay if active */}
          {event.matchReason && (
            <div className="mt-3 rounded-lg bg-amber-50/70 p-2.5 border border-amber-100">
              <p className="font-sans text-[11px] font-medium leading-relaxed text-amber-900 italic">
                💡 AI: "{event.matchReason}"
              </p>
            </div>
          )}

          {/* Tags list */}
          <div className="mt-4 flex flex-wrap gap-1">
            {event.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="rounded bg-slate-50 px-1.5 py-0.5 font-mono text-[9px] text-slate-500 border border-slate-100"
              >
                #{tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[9px] text-slate-400 font-semibold border border-slate-100">
                +{event.tags.length - 3} more
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
            {/* View button */}
            <button
              onClick={() => setIsDetailOpen(true)}
              className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50"
              id={`btn-view-${event.id}`}
            >
              Info & Location
            </button>

            {/* Interaction Tray */}
            <div className="flex items-center gap-1.5">
              {/* Bookmark */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark(event.id);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors border ${
                  event.clientBookmarked
                    ? "bg-rose-50 border-rose-200 text-rose-500"
                    : "bg-white border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50"
                }`}
                title="Bookmark Event"
                id={`btn-bookmark-${event.id}`}
              >
                <Bookmark className="h-4 w-4" fill={event.clientBookmarked ? "currentColor" : "none"} />
              </button>

              {/* RSVP Button */}
              <button
                disabled={event.isCanceled}
                onClick={(e) => {
                  e.stopPropagation();
                  onRSVP(event.id);
                }}
                className={`flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-bold tracking-wide transition-all shadow-sm ${
                  event.isCanceled
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : event.clientRSVPed
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-slate-900 border border-slate-950 text-white hover:bg-slate-800"
                }`}
                id={`btn-rsvp-${event.id}`}
              >
                {event.clientRSVPed ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    RSVPed
                  </>
                ) : (
                  <>
                    <Ticket className="h-3.5 w-3.5" />
                    RSVP ({event.rsvpCount || 0})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Admin editing/deletion row */}
          {isCreatorMode && (
            <div className="mt-3 flex items-center justify-between border-t border-dashed border-slate-100 pt-3">
              <span className="text-[10px] uppercase font-bold text-amber-600 flex items-center gap-1">
                <User className="h-3 w-3" /> Host Controls
              </span>
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(event)}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600 transition-colors hover:bg-amber-100 border border-amber-200"
                    title="Edit Event"
                    id={`btn-edit-${event.id}`}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(event.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-red-50 text-red-500 transition-colors hover:bg-red-100 border border-red-200"
                    title="Delete Event"
                    id={`btn-delete-${event.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Popover / Overlay Details modal */}
      <AnimatePresence>
        {isDetailOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              id="detail-backdrop"
            />

            {/* Event Details Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl z-10 max-h-[90vh] flex flex-col border border-slate-100"
              id="detail-modal"
            >
              {/* Header Visual Banner */}
              <div className="relative h-64 bg-slate-100 overflow-hidden shrink-0">
                <img
                  src={event.bannerUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1000&auto=format&fit=crop&q=80"}
                  alt={event.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                {/* Closing button */}
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm shadow-md"
                  id="btn-close-detail"
                >
                  ✕
                </button>

                {/* Overlay Header text */}
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="rounded bg-amber-500 px-2.5 py-1 text-[11px] font-bold tracking-wider text-white uppercase shadow-sm">
                    {event.category}
                  </span>
                  <h2 className="mt-2 text-2xl md:text-3xl font-display font-extrabold text-white tracking-tight drop-shadow">
                    {event.title}
                  </h2>
                </div>
              </div>

              {/* Scrollable description & specs */}
              <div className="overflow-y-auto p-6 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left columns - Rich context info */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h4 className="font-display font-semibold text-slate-800 text-sm mb-1.5 uppercase tracking-wide text-[11px]">
                        Event Overview
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </div>

                    <div className="pt-2">
                      <h4 className="font-display font-semibold text-slate-800 text-sm mb-2 uppercase tracking-wide text-[11px]">
                        Host / Event Organizer
                      </h4>
                      <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-extrabold">
                          {event.hostName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">{event.hostName}</p>
                          <p className="text-[10px] text-slate-500">Event Publisher & Curator</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right column - Event specifications details card */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-4 relative self-start">
                    <h4 className="font-display font-bold text-slate-800 text-xs uppercase tracking-wider">
                      Event Summary
                    </h4>

                    {/* Meta info checklist */}
                    <div className="space-y-3.5 text-xs text-slate-600">
                      <div className="flex items-start gap-2.5">
                        <Calendar className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">Date</p>
                          <p className="text-[11px] text-slate-500">{formatEventDate(event.dateTime)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Clock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">Timing</p>
                          <p className="text-[11px] text-slate-500">{formatEventTime(event.dateTime)}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <MapPin className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">Location Map</p>
                          <p className="text-[11px] text-slate-500">{event.location}</p>
                          <p className="text-[10px] text-amber-700 hover:underline mt-1">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                event.location + " Addis Ababa"
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              📍 View on Google Maps ↗
                            </a>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <Ticket className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-800">Admission Fee</p>
                          <p className="text-[11px] text-slate-500 font-bold text-slate-800">
                            {event.price === 0 ? "Free Entrance" : `${event.price} Ethiopian Birr`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bookmarking and Sharing */}
                    <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={handleShare}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                        id="btn-share-event"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        {copied ? "Copied!" : "Share Link"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Full-width tag list footer */}
                <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap gap-1.5">
                  <span className="text-xs font-semibold text-slate-400 self-center mr-1">Tags:</span>
                  {event.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 border border-slate-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                <p className="text-xs text-slate-500 font-medium">
                  Currently {event.rsvpCount || 0} RSVPs logged
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onBookmark(event.id);
                    }}
                    className={`rounded-xl px-3 border transition-colors ${
                      event.clientBookmarked
                        ? "bg-rose-50 border-rose-200 text-rose-500"
                        : "bg-white border-slate-200 text-slate-400 hover:text-rose-500"
                    }`}
                    id="btn-bookmark-action"
                  >
                    <Bookmark fill={event.clientBookmarked ? "currentColor" : "none"} className="h-4 w-4" />
                  </button>
                  <button
                    disabled={event.isCanceled}
                    onClick={() => {
                      onRSVP(event.id);
                    }}
                    className={`rounded-xl px-6 py-2 text-xs font-bold leading-none shadow-md transition-all ${
                      event.isCanceled
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : event.clientRSVPed
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-300"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                    }`}
                    id="btn-rsvp-action"
                  >
                    {event.clientRSVPed ? "🎉 RSVP Confirmed" : "RSVP Ticket & Save"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
