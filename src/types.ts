export type UserRole = "volunteer" | "org" | "csr team" | "admin" | "ngo poc" | "donator" | "govt official" | "auditor";

export interface UserProfile {
  username: string;
  role: UserRole;
  xp: number;
  level: number;
  streak: number;
  badges: string[];
  reputationScore: number; // 0-100
  savedReportsCount: number;
  accentColor?: string; // e.g. "indigo" | "emerald" | "rose" | "violet" | "amber"
  density?: "compact" | "cozy" | "spacious";
  preferredCauses?: string[];
  profileIcon?: string;
}

export interface Volunteer {
  id: string;
  name: string;
  skills: string[];
  location: string;
  coordinates: { x: number; y: number }; // Relative grid coordinates
  availability: string[]; // ['Weekend', 'Evening', 'Weekday']
  reliabilityScore: number; // 0-100
  hoursContributed: number;
  pastEventsCount: number;
  personalityType: "Explorer" | "Helper" | "Organizer" | "Crisis Responder";
}

export interface NGO {
  id: string;
  name: string;
  focus: string[];
  location: string;
  trustRating: number; // 0-100
  pocName: string;
  pocPhone: string;
  verified: boolean;
}

export interface EventLogistics {
  rolesRequired: string[];
  materialsChecklist: { item: string; needed: number; secured: number }[];
  timeline: { time: string; activity: string }[];
  risks: { hazard: string; mitigation: string }[];
}

export interface VolunteerEvent {
  id: string;
  title: string;
  ngoId: string;
  ngoName: string;
  description: string;
  location: string;
  stateKey: string; // e.g., 'maharashtra'
  date: string;
  sdgs: string[];
  status: "PLANNING" | "ACTIVE" | "COMPLETED";
  volunteersRequired: number;
  volunteersMatched: string[]; // Volunteer IDs
  logistics: EventLogistics;
  feedback?: {
    volunteerCount: number;
    rating: number;
    textSummary: string;
    sentimentScore: number; // -1 to 1
    escalations: string[];
  };
}

export interface StateData {
  name: string;
  volunteers: number;
  ngos: number;
  events: number;
  coverageIndex: number; // 0-100 (high is good, low needs support)
  urgencyLevel: "LOW" | "MEDIUM" | "HIGH";
}

export interface FAQItem {
  question: string;
  answer: string;
  category: "volunteer" | "ngo" | "csr";
  keywords: string[];
}

export interface LiveFeedItem {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "success" | "warning" | "danger";
}
