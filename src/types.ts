export interface EventItem {
  id: string;
  title: string;
  category: string;
  dateTime: string;
  location: string;
  description: string;
  price: number;
  tags: string[];
  bannerUrl?: string;
  hostName: string;
  rsvpCount: number;
  isCanceled?: boolean;
  // Dynamic client attributes
  clientBookmarked?: boolean;
  clientRSVPed?: boolean;
  matchScore?: number;
  matchReason?: string;
}

export type EventCategory =
  | "All Categories"
  | "Concerts & Music"
  | "Art & Exhibitions"
  | "Networking & Tech"
  | "Food & Culture"
  | "Outdoors & Sports"
  | "Theater & Film";

export const ALL_CATEGORIES: EventCategory[] = [
  "All Categories",
  "Concerts & Music",
  "Art & Exhibitions",
  "Networking & Tech",
  "Food & Culture",
  "Outdoors & Sports",
  "Theater & Film"
];

export interface AICopywriterResult {
  title: string;
  category: string;
  description: string;
  tags: string[];
}

export interface AISearchResult {
  recommendations: {
    id: string;
    score: number;
    reason: string;
  }[];
  chatResponse: string;
}
