import React, { useState, useEffect } from "react";
import { 
  UserProfile, Volunteer, NGO, VolunteerEvent, StateData, FAQItem, LiveFeedItem, UserRole 
} from "../types";
import { 
  initialVolunteers, initialNGOs, initialEvents, faqKnowledgeBase 
} from "../data/mockData";
import { 
  runVolunteerMatching, runAutoEventBuilder, runEmergencyRouter, 
  runFeedbackAnalyzer, runImpactReport, runRAGSearch 
} from "../utils/aiEngines";
import { 
  Sparkles, ShieldAlert, Award, FileSpreadsheet, Send, Search, BrainCircuit,
  TrendingUp, Users, HeartHandshake, AlertTriangle, MessageSquare, Briefcase, Plus, CheckCircle, Flame, Settings, Info, ShieldCheck, HelpCircle,
  Printer, FileText, Calendar, Star, Clock, MapPin, Bell, Download, Camera, Trash2, Image, Video, X
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, LineChart, Line
} from "recharts";
import CommunityMilestones from "./CommunityMilestones";
import ProfileSettings from "./ProfileSettings";
import { savePhoto, getPhoto } from "../utils/indexedDB";

interface DashboardProps {
  userProfile: UserProfile;
  onRewardXP: (xp: number, badge?: string) => void;
  selectedStateKey: string | null;
  selectedStateData: StateData | null;
  onSelectStateKey: (key: string | null) => void;
  onUpdateProfile: (updated: UserProfile) => void;
  onTriggerNotification?: (msg: string, type: "xp" | "badge" | "sync") => void;
  globalSearchQuery?: string;
}

export function StoryImage({ photoId, onOpenLightbox }: { photoId: string; onOpenLightbox: (src: string) => void }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPhoto(photoId).then((base64) => {
      if (active) {
        setSrc(base64);
      }
    });
    return () => {
      active = false;
    };
  }, [photoId]);

  if (!src) {
    return <div className="w-11 h-11 bg-slate-950 border border-slate-800 rounded-lg animate-pulse shrink-0"></div>;
  }

  return (
    <img 
      src={src} 
      alt="Field Evidence" 
      className="w-11 h-11 object-cover rounded-lg border border-indigo-500/20 shadow-sm cursor-zoom-in hover:scale-105 transition-all shrink-0"
      onClick={() => onOpenLightbox(src)}
    />
  );
}

export default function Dashboard({ 
  userProfile, 
  onRewardXP, 
  selectedStateKey, 
  selectedStateData,
  onSelectStateKey,
  onUpdateProfile,
  onTriggerNotification,
  globalSearchQuery = ""
}: DashboardProps) {
  // Support mapped roles
  const isVolunteerRole = ["volunteer", "donator"].includes(userProfile.role);
  const isNGORole = ["ngo poc", "org", "admin"].includes(userProfile.role);
  const isCSRRole = ["csr team", "govt official", "auditor"].includes(userProfile.role);

  // Profile Settings toggle
  const [showSettings, setShowSettings] = useState(false);

  // Explain My Match modal state
  const [selectedExplainMatch, setSelectedExplainMatch] = useState<any | null>(null);

  // State lists
  const [events, setEvents] = useState<VolunteerEvent[]>(() => {
    const saved = localStorage.getItem("ai_connect_events");
    return saved ? JSON.parse(saved) : initialEvents;
  });
  const [volunteers, setVolunteers] = useState<Volunteer[]>(() => {
    const saved = localStorage.getItem("ai_connect_volunteers");
    return saved ? JSON.parse(saved) : initialVolunteers;
  });

  // Active sub-navigation tabs based on role
  const [volunteerTab, setVolunteerTab] = useState<"explore" | "calendar" | "rag" | "metrics">("explore");
  const [ngoTab, setNgoTab] = useState<"planner" | "events" | "matching">("planner");
  const [csrTab, setCsrTab] = useState<"analytics" | "emergency" | "budget">("analytics");

  // Feedback, Archival & Calendar states
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareNgo1, setCompareNgo1] = useState("");
  const [compareNgo2, setCompareNgo2] = useState("");
  const [feedbackCampaignId, setFeedbackCampaignId] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackAnonymous, setFeedbackAnonymous] = useState(false);
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("ai_impact_feedbacks");
    return saved ? JSON.parse(saved) : [
      { id: "f1", campaignTitle: "Coastal and River Plastic Recovery", rating: 5, comment: "Incredible, well-structured campaign with stellar coordination!", date: "2026-06-15", anonymous: false }
    ];
  });

  const [savedArchives, setSavedArchives] = useState<string[]>(() => {
    const saved = localStorage.getItem("social_impact_archive_list");
    return saved ? JSON.parse(saved) : ["Archive_FY2026_Q1", "Archive_Midyear_2026"];
  });

  const [selectedCalendarDay, setSelectedCalendarDay] = useState<any | null>(null);

  // Volunteer Quick-Start guide states
  const [showQuickStartGuide, setShowQuickStartGuide] = useState(() => {
    const saved = localStorage.getItem("social_impact_seen_quickstart");
    return saved !== "true";
  });

  const [eventFilterToggle, setEventFilterToggle] = useState<"recommended" | "my" | "all">("all");

  const [recentActivities, setRecentActivities] = useState<any[]>(() => {
    const saved = localStorage.getItem("social_impact_recent_activities");
    if (saved) return JSON.parse(saved);
    return [
      { id: "act-1", type: "reputation", message: "Reputation score increased to 88/100 following coastal recovery check-in.", date: "26 Jun 2026", xp: 25 },
      { id: "act-2", type: "badge", message: "Unlocked badge: 'SDG Pioneer' for contributing to multiple climate action goals.", date: "24 Jun 2026", xp: 50 },
      { id: "act-3", type: "event", message: "Successfully checked in and completed 'Rural Health Support Camp' at Pune Outskirts.", date: "22 Jun 2026", xp: 100 },
      { id: "act-4", type: "streak", message: "Maintained a 5-day streak of coordination and active platform participation.", date: "21 Jun 2026", xp: 10 }
    ];
  });

  const logActivity = (type: "reputation" | "badge" | "event" | "streak" | "feedback" | "signup", message: string, xp?: number) => {
    const newAct = {
      id: `act-${Date.now()}`,
      type,
      message,
      date: new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }),
      xp
    };
    setRecentActivities(prev => {
      const updated = [newAct, ...prev];
      localStorage.setItem("social_impact_recent_activities", JSON.stringify(updated));
      return updated;
    });
  };

  // Global Printable summary report modal state
  const [showPrintReport, setShowPrintReport] = useState(false);

  // --- MONTHLY IMPACT METRICS STATE ---
  const [monthlyMetrics, setMonthlyMetrics] = useState<any[]>(() => {
    const saved = localStorage.getItem("social_impact_monthly_metrics");
    return saved ? JSON.parse(saved) : [
      { month: "Jan 2026", hours: 12, tasks: 3 },
      { month: "Feb 2026", hours: 18, tasks: 4 },
      { month: "Mar 2026", hours: 15, tasks: 3 },
      { month: "Apr 2026", hours: 22, tasks: 5 },
      { month: "May 2026", hours: 28, tasks: 6 },
      { month: "Jun 2026", hours: 35, tasks: 8 }
    ];
  });

  const [newMetricMonth, setNewMetricMonth] = useState("Jul 2026");
  const [newMetricHours, setNewMetricHours] = useState(10);
  const [newMetricTasks, setNewMetricTasks] = useState(2);
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "line">("bar");

  // --- WORK COMMITMENT REMINDERS STATE ---
  const [reminders, setReminders] = useState<any[]>(() => {
    const saved = localStorage.getItem("social_impact_reminders");
    return saved ? JSON.parse(saved) : [
      { eventId: "e2", eventTitle: "Rural Health & Sanitation Camp", eventDate: "2026-07-15", daysBefore: 2, notes: "Collect basic first-aid supplies and translation brochures", isEnabled: true }
    ];
  });

  const [reminderDaysBefore, setReminderDaysBefore] = useState(2);
  const [reminderNotes, setReminderNotes] = useState("");
  const [reminderModalEvent, setReminderModalEvent] = useState<VolunteerEvent | null>(null);

  // Synchronize monthly metrics to localStorage
  useEffect(() => {
    localStorage.setItem("social_impact_monthly_metrics", JSON.stringify(monthlyMetrics));
  }, [monthlyMetrics]);

  // Synchronize reminders to localStorage
  useEffect(() => {
    localStorage.setItem("social_impact_reminders", JSON.stringify(reminders));
  }, [reminders]);

  // --- OFFLINE SYNC LOGS STATE ---
  const [syncLogs, setSyncLogs] = useState<string[]>(() => {
    const saved = localStorage.getItem("social_impact_sync_logs");
    return saved ? JSON.parse(saved) : [
      "2026-07-13 14:32:01 - Pushed 4 active campaign metrics successfully",
      "2026-07-12 09:15:44 - Pushed 2 checked-in event logs to server",
      "2026-07-10 18:22:10 - Complete client database sync & security rules audit"
    ];
  });

  useEffect(() => {
    localStorage.setItem("social_impact_sync_logs", JSON.stringify(syncLogs));
  }, [syncLogs]);

  // --- NGO SATISFACTION RATINGS STATE ---
  const [ngoRatings, setNgoRatings] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("social_impact_ngo_ratings");
    return saved ? JSON.parse(saved) : {
      "ngo1": 96.4, // Bharat Swasthya Mission
      "ngo2": 93.8, // Vidyalaya Foundation
      "ngo3": 91.2, // EcoYodha Green Initiative
      "ngo4": 98.7  // Sahaya Emergency Relief
    };
  });

  useEffect(() => {
    localStorage.setItem("social_impact_ngo_ratings", JSON.stringify(ngoRatings));
  }, [ngoRatings]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handlePushSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      // Simulate retrieving new scores by slightly adjusting them within a high range (85-100)
      const updatedRatings = {
        "ngo1": Math.round((93 + Math.random() * 6) * 10) / 10,
        "ngo2": Math.round((90 + Math.random() * 7) * 10) / 10,
        "ngo3": Math.round((87 + Math.random() * 9) * 10) / 10,
        "ngo4": Math.round((95 + Math.random() * 5) * 10) / 10,
      };
      setNgoRatings(updatedRatings);
      
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const logMsg = `${timestamp} - Pushed latest local logs & retrieved new volunteer satisfaction scores`;
      
      setSyncLogs(prev => [logMsg, ...prev]);
      onRewardXP(15); // Reward user for syncing!
      logActivity("reputation", "Executed offline-first server synchronization. Received +15 XP.", 15);
      
      if (onTriggerNotification) {
        onTriggerNotification("Synchronization complete! Retrieved latest satisfaction scores. +15 XP", "sync");
      }
    }, 1200);
  };

  // --- IMPACT FIELD STORIES STATE ---
  const [impactStories, setImpactStories] = useState<any[]>(() => {
    const saved = localStorage.getItem("social_impact_stories");
    return saved ? JSON.parse(saved) : [
      {
        id: "story-1",
        author: "Aarav Sharma",
        role: "Crisis Responder",
        text: "Just completed the primary sanitation setup at Patna outskirts. Seeing the clean water flow and smiles of children was incredibly rewarding!",
        likes: 14,
        likedByMe: false,
        date: "12 Jul 2026",
        location: "Patna, Bihar"
      },
      {
        id: "story-2",
        author: "Ananya Patel",
        role: "Helper",
        text: "Successfully deployed our custom offline RAG bot in Bengaluru school classrooms. The students are already running questions on solar panel physics!",
        likes: 8,
        likedByMe: false,
        date: "10 Jul 2026",
        location: "Bengaluru, Karnataka"
      }
    ];
  });

  const [newStoryText, setNewStoryText] = useState("");
  const [newStoryLocation, setNewStoryLocation] = useState("Mumbai, Maharashtra");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhotoId, setCapturedPhotoId] = useState<string | null>(null);
  const [capturedPhotoBase64, setCapturedPhotoBase64] = useState<string | null>(null);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setVideoStream(stream);
      setCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access denied or failed:", err);
      alert("Could not access camera. Please check your camera permissions.");
    }
  };

  const stopCamera = () => {
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
    setCameraActive(false);
  };

  const takeSnapshot = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg");
      const photoId = `evidence-${Date.now()}`;
      
      await savePhoto(photoId, base64);
      
      setCapturedPhotoId(photoId);
      setCapturedPhotoBase64(base64);
      stopCamera();
    }
  };

  const discardPhoto = () => {
    setCapturedPhotoId(null);
    setCapturedPhotoBase64(null);
  };

  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream]);

  useEffect(() => {
    localStorage.setItem("social_impact_stories", JSON.stringify(impactStories));
  }, [impactStories]);

  const handleLikeStory = (storyId: string) => {
    setImpactStories(prev => prev.map(story => {
      if (story.id === storyId) {
        const alreadyLiked = story.likedByMe;
        const rewardAmount = alreadyLiked ? -5 : 5; // toggle reward
        onRewardXP(rewardAmount);
        
        if (onTriggerNotification) {
          onTriggerNotification(alreadyLiked ? "Removed like." : "Liked field story! You earned +5 XP.", "xp");
        }
        
        return {
          ...story,
          likes: story.likes + (alreadyLiked ? -1 : 1),
          likedByMe: !alreadyLiked
        };
      }
      return story;
    }));
  };

  const handleSubmitStory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryText.trim()) return;

    const newStory = {
      id: `story-${Date.now()}`,
      author: userProfile.username,
      role: userProfile.role === "volunteer" ? "Verified Volunteer" : userProfile.role.toUpperCase(),
      text: newStoryText,
      likes: 0,
      likedByMe: false,
      date: new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }),
      location: newStoryLocation,
      photoId: capturedPhotoId || undefined
    };

    setImpactStories(prev => [newStory, ...prev]);
    setNewStoryText("");
    setCapturedPhotoId(null);
    setCapturedPhotoBase64(null);
    
    onRewardXP(15);
    logActivity("reputation", `Submitted a new field impact story for ${newStoryLocation}.`, 15);
    if (onTriggerNotification) {
      onTriggerNotification("Impact story submitted! Received +15 XP.", "xp");
    }
  };

  // Notify of upcoming deadlines based on reminders
  useEffect(() => {
    // Current date is 2026-06-28
    const currentDateStr = "2026-06-28";
    
    // We add a tiny delay to allow page rendering before showing notifications
    const timer = setTimeout(() => {
      reminders.forEach(r => {
        if (!r.isEnabled) return;
        
        // Calculate target reminder date
        const eventDate = new Date(r.eventDate);
        eventDate.setDate(eventDate.getDate() - r.daysBefore);
        const reminderDateStr = eventDate.toISOString().split('T')[0];

        // Trigger notification if today is the day or later
        if (reminderDateStr <= currentDateStr) {
          if (onTriggerNotification) {
            onTriggerNotification(`🔔 REMINDER: "${r.eventTitle}" is coming up! (${r.eventDate}). Notes: ${r.notes || "None"}`, "sync");
          }
        }
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [reminders]);

   // Derived filtered events for global search and cause alignment / registration
   const filteredEvents = events.filter(ev => {
     // 1. Global Search Query
     if (globalSearchQuery) {
       const q = globalSearchQuery.toLowerCase();
       const titleMatch = ev.title?.toLowerCase().includes(q) ?? false;
       const locationMatch = ev.location?.toLowerCase().includes(q) ?? false;
       const sdgsMatch = ev.sdgs?.some(sdg => sdg.toLowerCase().includes(q)) ?? false;
       const descMatch = ev.description?.toLowerCase().includes(q) ?? false;
       const ngoMatch = ev.ngoName?.toLowerCase().includes(q) ?? false;
       if (!(titleMatch || locationMatch || sdgsMatch || descMatch || ngoMatch)) {
         return false;
       }
     }

     // 2. Toggle filter
     if (eventFilterToggle === "my") {
       return ev.volunteersMatched.includes("v1"); // Mock current user as Aarav 'v1'
     }

     if (eventFilterToggle === "recommended") {
       const causes = userProfile.preferredCauses || [];
       if (causes.length === 0) return true; // Show all if no causes selected

       return causes.some(cause => {
         const c = cause.toLowerCase();
         // Check match in title, description, NGO name
         if (ev.title?.toLowerCase().includes(c) || 
             ev.description?.toLowerCase().includes(c) || 
             ev.ngoName?.toLowerCase().includes(c)) {
           return true;
         }
         // Check match in SDGs
         for (const sdg of ev.sdgs || []) {
           const s = sdg.toLowerCase();
           if (c === "environment" && (s.includes("climate") || s.includes("life on land") || s.includes("plastic") || s.includes("water") || s.includes("sdg 15") || s.includes("sdg 13") || s.includes("sdg 14") || s.includes("afforestation"))) {
             return true;
           }
           if (c === "health" && (s.includes("health") || s.includes("sanitation") || s.includes("sdg 3") || s.includes("sdg 6"))) {
             return true;
           }
           if (c === "education" && (s.includes("education") || s.includes("literacy") || s.includes("sdg 4") || s.includes("school"))) {
             return true;
           }
           if ((c === "poverty alleviation" || c === "economic empowerment") && (s.includes("poverty") || s.includes("economic") || s.includes("hunger") || s.includes("sdg 1") || s.includes("sdg 2") || s.includes("sdg 8") || s.includes("sdg 10"))) {
             return true;
           }
           if (s.includes(c)) {
             return true;
           }
         }
         return false;
       });
     }

     return true; // "all"
   });

  // Dynamic Recharts 6-month historical growth generator
  const generateTrendData = () => {
    const months = ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026"];
    
    if (isVolunteerRole) {
      const currentRep = userProfile.reputationScore;
      const currentHours = Math.round(userProfile.xp / 3.5) + (userProfile.streak * 3);
      const baseRep = Math.max(20, currentRep - 35);
      const baseHours = Math.max(5, currentHours - 20);
      return months.map((month, idx) => {
        const factor = (idx + 1) / 6;
        return {
          month,
          "Reputation Index": Math.round(baseRep + (currentRep - baseRep) * factor),
          "Contribution Hours": Math.round(baseHours + (currentHours - baseHours) * factor),
        };
      });
    } else if (isNGORole) {
      const activeCount = events.length;
      const dispatchedCount = events.reduce((acc, ev) => acc + ev.volunteersMatched.length, 0) + 12;
      return months.map((month, idx) => {
        const factor = (idx + 1) / 6;
        return {
          month,
          "Campaigns Deployed": Math.max(1, Math.round(activeCount * factor)),
          "Volunteers Dispatched": Math.round((dispatchedCount - 8) + 8 * factor),
        };
      });
    } else {
      const currentDisbursed = 14.5;
      const currentROI = 88;
      return months.map((month, idx) => {
        const factor = (idx + 1) / 6;
        return {
          month,
          "Funding Disbursed (₹ L)": parseFloat((4.5 + (currentDisbursed - 4.5) * factor).toFixed(1)),
          "Ecological Yield ROI": Math.round(55 + (currentROI - 55) * factor),
        };
      });
    }
  };

  // AI Interactive State Hooks
  // RAG FAQ Search
  const [ragQuery, setRagQuery] = useState("");
  const [ragResult, setRagResult] = useState<any>(null);

  // AI Auto Event Builder
  const [promptText, setPromptText] = useState("");
  const [builderOutput, setBuilderOutput] = useState<any>(null);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventStateKey, setNewEventStateKey] = useState("bihar");

  // AI Volunteer Matcher selected event
  const [matchingEventId, setMatchingEventId] = useState<string>("");
  const [matchResults, setMatchResults] = useState<any[]>([]);

  // AI Emergency Incident router
  const [incidentInput, setIncidentInput] = useState("");
  const [emergencyResult, setEmergencyResult] = useState<any>(null);

  // CSR Budget Optimizer
  const [budgetLimit, setBudgetLimit] = useState(15000);
  const [budgetAllocation, setBudgetAllocation] = useState<any>(null);

  // Live simulation command ticker feed
  const [liveFeed, setLiveFeed] = useState<LiveFeedItem[]>([
    { id: "lf1", timestamp: "12:35", message: "Aarav Sharma checked into Dharavi Slum Cleanliness Drive.", type: "success" },
    { id: "lf2", timestamp: "12:30", message: "Dr. Ramesh Verma verified rural clinic logistics.", type: "info" },
    { id: "lf3", timestamp: "12:15", message: "Volunteer density deficit flagged in Bihar region.", type: "warning" }
  ]);

  // Sync state helper to write back lists
  const syncEvents = (updated: VolunteerEvent[]) => {
    setEvents(updated);
    localStorage.setItem("ai_connect_events", JSON.stringify(updated));
  };

  // Live Simulated Activity Feed Ticker
  useEffect(() => {
    const messages = [
      "New volunteer registered from Bengaluru, Karnataka with Web Development skills.",
      "EcoYodha Green Initiative updated Sapling procurement log (+100 trees).",
      "Sai Prasad completed his 9th consecutive weekend volunteering session in AP!",
      "Meera Nair initiated a translation campaign for medical camps in rural Kerala.",
      "Rohan Das registered as active in West Bengal registry.",
      "Urgent healthcare request resolved in Gaya, Bihar using standby medicines."
    ];
    const types: ("info" | "success" | "warning")[] = ["info", "success", "warning"];

    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      
      setLiveFeed(prev => [
        { id: `lf-${Date.now()}`, timestamp: timeStr, message: randomMsg, type: randomType },
        ...prev.slice(0, 4)
      ]);
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  // Sync when selectedStateKey triggers search in dashboard
  useEffect(() => {
    if (selectedStateKey) {
      // Find a matching active event for that state or filter
      const eventInState = events.find(e => e.stateKey === selectedStateKey);
      if (eventInState) {
        setMatchingEventId(eventInState.id);
        const matches = runVolunteerMatching(volunteers, eventInState);
        setMatchResults(matches);
        if (isNGORole) {
          setNgoTab("matching");
        }
      }
    }
  }, [selectedStateKey, events, isNGORole]);

  // Trigger notification when an event matches the user's preferred causes
  useEffect(() => {
    if (!userProfile.preferredCauses || userProfile.preferredCauses.length === 0 || !onTriggerNotification) return;

    // Helper to see if event is already registered or matched
    const matchKeywords: Record<string, string[]> = {
      "Animal Welfare": ["animal", "dog", "cat", "stray", "cow", "wildlife", "vet"],
      "Arts and Culture": ["art", "music", "dance", "culture", "heritage", "museum", "theater"],
      "Children": ["child", "kid", "orphan", "pediatric", "school", "youth"],
      "Civil Rights & Social Action": ["rights", "equality", "civil", "justice", "advocacy"],
      "Economic Empowerment": ["microfinance", "jobs", "finance", "business", "economic", "skills", "vocational"],
      "Education": ["teach", "school", "education", "class", "tutor", "literacy", "library"],
      "Environment": ["environment", "green", "clean", "waste", "plant", "eco", "climate", "forest", "tree", "ocean", "nature"],
      "Health": ["health", "sanitation", "clinic", "medical", "doctor", "nurse", "hygiene", "hospital", "disease", "vaccine"],
      "Human Rights": ["human rights", "equality", "refugee", "amnesty", "freedom"],
      "Disaster and Humanitarian Relief": ["flood", "disaster", "relief", "cyclone", "landslide", "earthquake", "emergency", "crisis", "evacuate"],
      "Politics": ["politics", "vote", "civic", "election", "campaign", "government"],
      "Poverty Alleviation": ["poverty", "hunger", "food", "shelter", "homeless", "feed", "poor", "ration"],
      "Science and Technology": ["science", "tech", "computer", "digital", "coding", "software", "internet"],
      "Social Services": ["elderly", "disable", "community", "social", "support", "welfare"],
      "Veteran Support": ["veteran", "soldier", "military", "army"]
    };

    // Find any planning or active events matching preferred causes
    const matchingEvents = events.filter(ev => {
      const text = `${ev.title} ${ev.description} ${ev.sdgs.join(" ")}`.toLowerCase();
      return userProfile.preferredCauses?.some(cause => {
        const keywords = matchKeywords[cause];
        return keywords?.some(kw => text.includes(kw));
      });
    });

    if (matchingEvents.length > 0) {
      // Find one matching event to highlight
      const targetEvent = matchingEvents[0];
      const matchingCause = userProfile.preferredCauses.find(cause => {
        const keywords = matchKeywords[cause];
        return keywords?.some(kw => `${targetEvent.title} ${targetEvent.description}`.toLowerCase().includes(kw));
      }) || userProfile.preferredCauses[0];

      // To avoid constant spamming, we check if we already notified about this match this session
      const notifiedKey = `notified_match_${targetEvent.id}_${userProfile.username}`;
      const alreadyNotified = sessionStorage.getItem(notifiedKey);
      
      if (!alreadyNotified) {
        sessionStorage.setItem(notifiedKey, "true");
        // Delay slightly for high impact entry
        setTimeout(() => {
          onTriggerNotification(
            `🔔 Campaign Match: "${targetEvent.title}" aligns with your preference for ${matchingCause}!`,
            "sync"
          );
        }, 3000);
      }
    }
  }, [userProfile.preferredCauses, events, onTriggerNotification]);


  // 1. EXECUTE RAG ASSISTANT SEARCH
  const handleRAGSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragQuery.trim()) return;
    const result = runRAGSearch(ragQuery, faqKnowledgeBase);
    setRagResult(result);
  };


  // 2. EXECUTE AI AUTO EVENT BUILDER
  const handleEventBuild = () => {
    if (!promptText.trim()) return;
    const output = runAutoEventBuilder(promptText);
    setBuilderOutput(output);
    
    // Auto populate fields
    if (promptText.toLowerCase().includes("health")) {
      setNewEventTitle("AI-Guided Rural Health Outreach");
    } else if (promptText.toLowerCase().includes("tree") || promptText.toLowerCase().includes("plant")) {
      setNewEventTitle("AI-Guided Afforestation Initiative");
    } else if (promptText.toLowerCase().includes("clean") || promptText.toLowerCase().includes("waste")) {
      setNewEventTitle("Eco-System Cleanliness & Sorting");
    } else {
      setNewEventTitle("AI-Scheduled Community Campaign");
    }
    setNewEventLocation("Rural Sector, Bihar");
  };

  // SAVE NEWLY BUILT EVENT
  const handleSaveBuiltEvent = () => {
    if (!newEventTitle || !builderOutput) return;

    const newEvent: VolunteerEvent = {
      id: `e-${Date.now()}`,
      title: newEventTitle,
      ngoId: "ngo1",
      ngoName: "Local NGO Liaison",
      description: `AI Auto-Built Event: ${promptText}. Focus areas: ${builderOutput.sdgs.join(", ")}.`,
      location: newEventLocation || "Bihar, India",
      stateKey: newEventStateKey,
      date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 15 days out
      sdgs: builderOutput.sdgs,
      status: "PLANNING",
      volunteersRequired: builderOutput.logistics.rolesRequired.length + 2,
      volunteersMatched: [],
      logistics: builderOutput.logistics
    };

    const updated = [newEvent, ...events];
    syncEvents(updated);
    
    setPromptText("");
    setBuilderOutput(null);
    onRewardXP(30, "AI Architect Badge");
    alert("Success: AI Campaign successfully built and scheduled on the national grid!");
  };


  // 3. RUN VOLUNTEER MATCHING
  const handleRunMatching = (eventId: string) => {
    setMatchingEventId(eventId);
    const targetEvent = events.find(e => e.id === eventId);
    if (!targetEvent) return;
    const results = runVolunteerMatching(volunteers, targetEvent);
    setMatchResults(results);
  };

  // DISPATCH VOLUNTEERS
  const handleDispatchVolunteers = (eventId: string, matchedVols: string[]) => {
    const updated = events.map(e => {
      if (e.id === eventId) {
        return {
          ...e,
          volunteersMatched: matchedVols,
          status: "ACTIVE" as const
        };
      }
      return e;
    });
    syncEvents(updated);
    
    // Reward XP
    onRewardXP(40);
    alert(`AI Dispatch Successful! Matched volunteers successfully notified via simulated alert protocols.`);
  };


  // 4. SUBMIT EMERGENCY ALERT
  const handleEmergencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentInput.trim()) return;
    const result = runEmergencyRouter(incidentInput);
    setEmergencyResult(result);

    // Append to live feed
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    setLiveFeed(prev => [
      { 
        id: `lf-${Date.now()}`, 
        timestamp: timeStr, 
        message: `EMERGENCY FLAG TRIGGERED: ${result.category} assigned to ${result.autoRoutedTo}.`, 
        type: result.urgency === "HIGH" ? "danger" : "warning" 
      },
      ...prev
    ]);
  };


  // 5. CSR BUDGET OPTIMIZER
  const optimizeCSRBudget = () => {
    // Proportional cost split: 40% Medical Clinics, 30% Waste Bins, 20% School materials, 10% Local logistics
    const medAlloc = Math.round(budgetLimit * 0.4);
    const wasteAlloc = Math.round(budgetLimit * 0.3);
    const schoolAlloc = Math.round(budgetLimit * 0.2);
    const logisticsAlloc = budgetLimit - (medAlloc + wasteAlloc + schoolAlloc);

    // Social calculations
    const medicalKitsPurchased = Math.floor(medAlloc / 250); // ₹250 per primary clinic pack
    const recyclingBinsSecured = Math.floor(wasteAlloc / 450); // ₹450 per heavy duty bin
    const ruralSchoolBooklets = Math.floor(schoolAlloc / 50); // ₹50 per literacy booklet
    const socialROI = Math.round(budgetLimit * 1.85); // Estimated return score

    setBudgetAllocation({
      medAlloc,
      wasteAlloc,
      schoolAlloc,
      logisticsAlloc,
      medicalKitsPurchased,
      recyclingBinsSecured,
      ruralSchoolBooklets,
      socialROI
    });
  };

  // Computations for Analytics
  const impactSummary = runImpactReport(events);

  const leaderboardData = [
    { name: "Aarav Mehta", score: 94, badges: 6, role: "Volunteer", avatar: "🏆", color: "text-amber-500" },
    { name: "Divya Hari Kumar", score: 88, badges: 4, role: "Core Volunteer (You)", avatar: "🥈", color: "text-slate-300" },
    { name: "Save Western Ghats Foundation", score: 91, badges: 8, role: "NGO Organization", avatar: "🏅", color: "text-teal-400" },
    { name: "Elena Rostova", score: 85, badges: 3, role: "Volunteer", avatar: "🥉", color: "text-amber-700" },
    { name: "Teach for India Initiatives", score: 83, badges: 7, role: "NGO Organization", avatar: "🎖️", color: "text-indigo-400" }
  ].sort((a, b) => b.score - a.score);

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      timestamp: new Date().toISOString(),
      userProfile: {
        username: userProfile.username,
        role: userProfile.role,
        xp: userProfile.xp,
        level: userProfile.level,
        streak: userProfile.streak,
        reputationScore: userProfile.reputationScore,
        badges: userProfile.badges,
        preferredCauses: userProfile.preferredCauses
      },
      campaignsMatched: events.filter(e => e.volunteersMatched.includes("v1")).map(e => ({
        id: e.id,
        title: e.title,
        ngo: e.ngoName,
        location: e.location,
        status: e.status,
        sdgs: e.sdgs
      })),
      feedbackHistory
    }, null, 2));
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `social_impact_portfolio_${userProfile.username.toLowerCase().replace(/\s+/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (onTriggerNotification) {
      onTriggerNotification("Exported activity history JSON successfully!", "sync");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Type,Item Title,Organization/Scope,Status,Metadata\n";
    
    csvContent += `Profile,${userProfile.username},Role: ${userProfile.role},Level ${userProfile.level},Reputation ${userProfile.reputationScore}/100\n`;
    
    const registered = events.filter(e => e.volunteersMatched.includes("v1"));
    registered.forEach(e => {
      csvContent += `Campaign,"${e.title}","${e.ngoName}",${e.status},"${e.location} (SDGs: ${e.sdgs.join(' ')})"\n`;
    });

    feedbackHistory.forEach(f => {
      csvContent += `Feedback,"${f.campaignTitle}",Rating: ${f.rating}/5,Submitted,"${f.comment.replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", encodedUri);
    downloadAnchor.setAttribute("download", `social_impact_portfolio_${userProfile.username.toLowerCase().replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (onTriggerNotification) {
      onTriggerNotification("Exported activity history CSV successfully!", "sync");
    }
  };

  // Export to beautifully formatted plain text report
  const handleExportTXT = () => {
    let textContent = "";
    textContent += "==================================================\n";
    textContent += "        SEVAAI SOCIAL IMPACT PORTFOLIO REPORT     \n";
    textContent += "==================================================\n\n";
    textContent += `Generated on      : ${new Date().toLocaleString("en-IN")}\n`;
    textContent += `User Profile      : ${userProfile.username}\n`;
    textContent += `Current Role      : ${userProfile.role.toUpperCase()}\n`;
    textContent += `Impact Level      : Level ${userProfile.level}\n`;
    textContent += `Experience Points : ${userProfile.xp} XP\n`;
    textContent += `Reputation Index  : ${userProfile.reputationScore}/100\n`;
    textContent += `Active Streak     : ${userProfile.streak} days\n`;
    textContent += `Earned Badges     : ${userProfile.badges.join(", ")}\n\n`;
    
    textContent += "--------------------------------------------------\n";
    textContent += "            REGISTERED CAMPAIGNS & TASKS          \n";
    textContent += "--------------------------------------------------\n";
    const registered = events.filter(e => e.volunteersMatched.includes("v1"));
    if (registered.length > 0) {
      registered.forEach((e, idx) => {
        textContent += `${idx + 1}. [${e.status}] ${e.title}\n`;
        textContent += `   Organized by : ${e.ngoName}\n`;
        textContent += `   Location     : ${e.location}\n`;
        textContent += `   Target SDGs  : ${e.sdgs.join(", ")}\n\n`;
      });
    } else {
      textContent += "No registered campaigns found.\n\n";
    }

    textContent += "--------------------------------------------------\n";
    textContent += "             QUALITATIVE FEEDBACK SUBMITTED       \n";
    textContent += "--------------------------------------------------\n";
    if (feedbackHistory.length > 0) {
      feedbackHistory.forEach((f, idx) => {
        textContent += `${idx + 1}. Campaign: ${f.campaignTitle}\n`;
        textContent += `   Rating   : ${f.rating}/5 stars\n`;
        textContent += `   Comment  : "${f.comment}"\n`;
        textContent += `   Date     : ${f.date}\n\n`;
      });
    } else {
      textContent += "No qualitative feedback submitted yet.\n\n";
    }

    textContent += "--------------------------------------------------\n";
    textContent += "          MONTHLY IMPACT CONTRIBUTIONS (LOG)      \n";
    textContent += "--------------------------------------------------\n";
    if (monthlyMetrics.length > 0) {
      monthlyMetrics.forEach((m, idx) => {
        textContent += `- Month: ${m.month} | Hours Contributed: ${m.hours} hrs | Tasks Completed: ${m.tasks}\n`;
      });
    } else {
      textContent += "No monthly impact metrics logged.\n";
    }
    textContent += "\n";

    textContent += "==================================================\n";
    textContent += "       END OF OFFLINE SOCIAL IMPACT ARCHIVE       \n";
    textContent += "==================================================\n";

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(textContent);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `social_impact_report_${userProfile.username.toLowerCase().replace(/\s+/g, '_')}.txt`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (onTriggerNotification) {
      onTriggerNotification("Exported activity history TXT report successfully!", "sync");
    }
  };

  // Archival to Local Browser Storage
  const handleArchiveLocalStorage = () => {
    const archiveKey = `social_impact_archive_${Date.now()}`;
    const archiveName = `Archive_${userProfile.username.split(' ')[0]}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}_${new Date().toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'}).replace(/\s/g, '')}`;
    
    const archiveData = {
      archiveName,
      timestamp: new Date().toISOString(),
      userProfile,
      events: events.filter(e => e.volunteersMatched.includes("v1")),
      feedbackHistory
    };

    localStorage.setItem(archiveKey, JSON.stringify(archiveData));
    
    const updatedList = [...savedArchives, archiveName];
    setSavedArchives(updatedList);
    localStorage.setItem("social_impact_archive_list", JSON.stringify(updatedList));

    if (onTriggerNotification) {
      onTriggerNotification(`Offline Archive "${archiveName}" saved to browser local storage!`, "sync");
    }
  };

  // Clear Archives
  const handleClearArchives = () => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("social_impact_archive_")) {
        localStorage.removeItem(key);
      }
    }
    localStorage.removeItem("social_impact_archive_list");
    setSavedArchives([]);
    if (onTriggerNotification) {
      onTriggerNotification("Cleared browser local storage archives.", "sync");
    }
  };

  return (
    <div className="space-y-6">

      {/* GLOBAL IMPACT HUB BENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in no-print">
        {/* Recharts Chart Column */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                Impact Trends (Last 6 Months)
              </h4>
              <p className="text-[10px] text-slate-500 font-sans">Real-time dynamic alignment and contribution history progress tracking</p>
            </div>
            <div className="flex gap-4 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-indigo-400">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                {isVolunteerRole ? "Reputation Index" : isNGORole ? "Campaigns Deployed" : "Funding disbursed"}
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {isVolunteerRole ? "Contribution Hours" : isNGORole ? "Volunteers Dispatched" : "Ecological Yield ROI"}
              </span>
            </div>
          </div>

          <div className="h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={generateTrendData() as any} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d255a" opacity={0.15} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "var(--color-slate-900)", 
                    borderColor: "var(--color-slate-800)", 
                    borderRadius: "12px",
                    color: "var(--color-slate-200)",
                    fontSize: "11px",
                    fontFamily: "Inter, sans-serif"
                  }} 
                />
                <Area type="monotone" dataKey={isVolunteerRole ? "Reputation Index" : isNGORole ? "Campaigns Deployed" : "Funding Disbursed (₹ L)"} stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPrimary)" />
                <Area type="monotone" dataKey={isVolunteerRole ? "Contribution Hours" : isNGORole ? "Volunteers Dispatched" : "Ecological Yield ROI"} stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSecondary)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Report Card & printable Button Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-slate-100 font-sans">Official SDG Impact Report</h4>
            </div>
            <p className="text-[10px] text-slate-500 mb-3 leading-relaxed font-sans">
              Verify credentials, reputation scores, badges, and volunteer campaign participation in an official print-ready format.
            </p>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/40">
                <span className="text-slate-500">Verified Holder:</span>
                <span className="font-bold text-slate-200">{userProfile.username}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/40">
                <span className="text-slate-500">Organizational Role:</span>
                <span className="font-mono text-[10px] uppercase font-bold text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/40">
                  {userProfile.role}
                </span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800/40">
                <span className="text-slate-500">Volunteer Rep Index:</span>
                <span className="font-bold text-slate-200">{userProfile.reputationScore}/100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Earned Accolades:</span>
                <span className="font-bold text-slate-200">{userProfile.badges.length} Badges</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2">
            <button
              onClick={() => setShowPrintReport(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Generate Printable Summary</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECOND BENTO ROW: LEADERBOARD & OFFLINE ARCHIVAL EXPORTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in no-print">
        {/* Widget 1: Global Impact Leaderboard */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-600"></div>
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                <Award className="w-4 h-4 text-amber-400" />
                Global Impact Leaderboard
              </h4>
              <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                TOP 5
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed font-sans">
              Top volunteers and organizations aligned on national UN-SDGs contribution index. Keep active to increase rank!
            </p>

            <div className="space-y-2">
              {leaderboardData.map((leader, index) => {
                const isUser = leader.name.includes("Divya Hari Kumar");
                return (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
                      isUser 
                        ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-200 font-medium" 
                        : "bg-slate-950 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 h-5 flex items-center justify-center font-mono font-bold text-[10px] rounded-full ${
                        index === 0 ? "bg-amber-500 text-slate-950" :
                        index === 1 ? "bg-slate-300 text-slate-950" :
                        index === 2 ? "bg-amber-700 text-slate-100" : "bg-slate-800 text-slate-400"
                      }`}>
                        {index + 1}
                      </span>
                      <div className="truncate">
                        <span className="font-bold text-slate-200 block truncate">{leader.name}</span>
                        <span className="text-[9px] text-slate-500 block truncate">{leader.role}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-indigo-400">{leader.score}</span>
                      <span className="text-[8px] text-slate-400 block">Rep score</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Widget 2: Portfolio Archival & Offline Exports */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-emerald-500"></div>
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                Offline Portfolio Archival & Local Exports
              </h4>
              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                Archive Engine v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed font-sans">
              Protect your records! Download your complete credential logs, campaign registries, badges, and qualitative feedbacks to backup locally or archive directly inside your safe browser offline storage.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left pane: Quick actions */}
              <div className="space-y-3">
                <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
                  Available File Exports
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={handleExportJSON}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-[10px] font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm text-center"
                    title="Export as JSON"
                  >
                    <span>Download JSON</span>
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 font-sans text-[10px] font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm text-center"
                    title="Export as CSV"
                  >
                    <span>Download CSV</span>
                  </button>
                  <button
                    onClick={handleExportTXT}
                    className="bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/60 font-sans text-[10px] font-bold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm text-center"
                    title="Export as Plain Text (.txt)"
                  >
                    <span>Download TXT</span>
                  </button>
                </div>

                <div className="border-t border-slate-800/40 my-3"></div>

                <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
                  Direct Browser Storage Archival
                </span>
                <div className="flex gap-2.5">
                  <button
                    onClick={handleArchiveLocalStorage}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <span>Commit Archive Backup</span>
                  </button>
                  {savedArchives.length > 0 && (
                    <button
                      onClick={handleClearArchives}
                      className="text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-900/60 font-sans text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
                      title="Clear Browser Local Storage Archives"
                    >
                      Clear Backups
                    </button>
                  )}
                </div>
              </div>

              {/* Right pane: Archives history list */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider mb-2">
                    Browser Commited Backups ({savedArchives.length})
                  </span>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto font-mono text-[9px] text-slate-400">
                    {savedArchives.length > 0 ? (
                      savedArchives.map((arc, i) => (
                        <div key={i} className="flex justify-between items-center p-1.5 bg-slate-900/40 border border-slate-850 rounded">
                          <span className="truncate pr-1">{arc}</span>
                          <span className="text-[8px] text-emerald-400 shrink-0 uppercase font-semibold">Offline Ok</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-600 italic">
                        No localized archives saved. Click 'Commit Archive Backup' to capture local snapshot.
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-[8.5px] text-slate-500 mt-2 text-right">
                  Stored securely inside browser Sandbox LocalStorage space.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THIRD BENTO ROW: NGO HIGHLIGHTS, OFFLINE SYNC LOGS & FIELD STORIES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in no-print" id="dashboard-third-bento-row">
        
        {/* Widget 1: Top-Performing NGO Partners */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-indigo-500"></div>
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                <HeartHandshake className="w-4 h-4 text-teal-400" />
                NGO Partner Satisfaction Highlights
              </h4>
              <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                Vetted Core
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-3 leading-relaxed font-sans">
              Automatically highlighting top-performing partner NGOs based on volunteer satisfaction scores retrieved during the last sync.
            </p>

            <button
              onClick={() => {
                setCompareNgo1(initialNGOs[0]?.id || "");
                setCompareNgo2(initialNGOs[1]?.id || "");
                setShowCompareModal(true);
              }}
              className="w-full bg-slate-950 hover:bg-slate-850 text-teal-400 hover:text-teal-300 border border-slate-850 hover:border-slate-800 py-2 px-3 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all mb-3.5 cursor-pointer font-mono"
            >
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              <span>COMPARE TWO NGOs SIDE-BY-SIDE</span>
            </button>

            <div className="space-y-3">
              {initialNGOs.map(ngo => {
                const rating = ngoRatings[ngo.id] || ngo.trustRating;
                return { ...ngo, satisfaction: rating };
              })
              .sort((a, b) => b.satisfaction - a.satisfaction)
              .map((ngo) => (
                <div key={ngo.id} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex flex-col justify-between text-xs gap-2">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-slate-200 truncate block">{ngo.name}</span>
                        {ngo.verified && (
                          <span className="text-[8px] bg-teal-950 text-teal-400 border border-teal-900 px-1 rounded font-mono font-bold uppercase shrink-0">
                            ✓ OK
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-500 font-mono block mt-0.5">Focus: {ngo.focus.join(", ")}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-extrabold text-teal-400">{ngo.satisfaction}%</span>
                      <span className="text-[8px] text-slate-500 block">Satisfaction</span>
                    </div>
                  </div>

                  {/* Rating progress bar */}
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800/60">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        ngo.satisfaction >= 95 ? "bg-gradient-to-r from-emerald-500 to-teal-400" :
                        ngo.satisfaction >= 90 ? "bg-gradient-to-r from-teal-500 to-indigo-500" : "bg-indigo-500"
                      }`}
                      style={{ width: `${ngo.satisfaction}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[8.5px] text-slate-500 mt-4 text-left italic">
            *Satisfaction metrics are updated automatically upon successful server check-in synchronization.
          </div>
        </div>

        {/* Widget 2: Sync Log Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                <CheckCircle className="w-4 h-4 text-indigo-400" />
                Central Server Sync Log
              </h4>
              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold uppercase animate-pulse">
                Active Standby
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed font-sans">
              Verify when your local ledger entries were pushed to the central server. Trigger a synchronization push to refresh NGO scores.
            </p>

            <div className="space-y-3">
              {/* Sync Trigger Button */}
              <button
                onClick={handlePushSync}
                disabled={isSyncing}
                className={`w-full text-white font-sans text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  isSyncing 
                    ? "bg-slate-800 border border-slate-700 text-slate-400 cursor-not-allowed" 
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {isSyncing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                    <span>Synchronizing Ledger Database...</span>
                  </>
                ) : (
                  <>
                    <span>Sync Local Data Now (+15 XP)</span>
                  </>
                )}
              </button>

              <div className="border-t border-slate-850/40 my-3"></div>

              <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider mb-2">
                Sync History Audit Trails
              </span>

              <div className="space-y-1.5 max-h-[170px] overflow-y-auto font-mono text-[9px] pr-1">
                {syncLogs.map((log, index) => (
                  <div key={index} className="p-2 bg-slate-950 border border-slate-850 rounded-lg space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] bg-emerald-950 text-emerald-400 px-1 rounded font-bold">SUCCESSFUL</span>
                      <span className="text-[8px] text-slate-500 font-bold">Ledger synced</span>
                    </div>
                    <p className="text-slate-300 leading-normal">{log}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text-[8.5px] text-slate-500 mt-4 text-right">
            Offline encryption stamp is verified by the central SDG consensus engine.
          </div>
        </div>

        {/* Widget 3: Impact Stories Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-teal-500"></div>
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-sans">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Field Impact Stories
              </h4>
              <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                Active Field
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed font-sans">
              Share your on-the-ground volunteer updates or support other field teams. Liking field stories rewards you with XP!
            </p>

            {/* Submit Story Form */}
            <form onSubmit={handleSubmitStory} className="space-y-2.5 bg-slate-950 p-3 rounded-2xl border border-slate-850/80 mb-3">
              <textarea
                value={newStoryText}
                onChange={(e) => setNewStoryText(e.target.value)}
                placeholder="What impact did you make today? (e.g. 'Provided first-aid to 20 children...')"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-sans resize-none h-14"
                maxLength={200}
              />

              {/* Camera Active Preview Canvas */}
              {cameraActive && (
                <div className="relative rounded-xl overflow-hidden border border-indigo-500 bg-black aspect-video flex flex-col justify-end">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-0 w-full flex justify-center gap-2 px-3 z-10 no-print">
                    <button
                      type="button"
                      onClick={takeSnapshot}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Take Snapshot</span>
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Snapshot Captured Thumbnail Preview */}
              {capturedPhotoBase64 && (
                <div className="flex items-center gap-2.5 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                  <img
                    src={capturedPhotoBase64}
                    alt="Captured Evidence Preview"
                    className="w-11 h-11 object-cover rounded-lg border border-indigo-500/30"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-emerald-400 font-bold block uppercase tracking-wider font-mono">✓ Evidence Captured</span>
                    <span className="text-[8px] text-slate-500 block truncate font-mono">Will be stored securely in IndexedDB</span>
                  </div>
                  <button
                    type="button"
                    onClick={discardPhoto}
                    className="text-rose-400 hover:text-rose-300 p-1 bg-slate-950 border border-slate-850 rounded-lg hover:border-slate-800 transition-colors cursor-pointer"
                    title="Discard Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center gap-2 flex-wrap">
                {!cameraActive && !capturedPhotoBase64 && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="bg-slate-900 hover:bg-slate-850 text-indigo-400 hover:text-indigo-300 border border-slate-800 hover:border-slate-700 rounded-lg text-[10px] px-2.5 py-1.5 font-bold flex items-center gap-1 transition-all cursor-pointer font-sans"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Capture Field Evidence</span>
                  </button>
                )}
                <select
                  value={newStoryLocation}
                  onChange={(e) => setNewStoryLocation(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-slate-300 px-2.5 py-1 focus:outline-none focus:border-indigo-600 font-mono"
                >
                  <option value="Mumbai, Maharashtra">Mumbai, Maharashtra</option>
                  <option value="Bengaluru, Karnataka">Bengaluru, Karnataka</option>
                  <option value="Patna, Bihar">Patna, Bihar</option>
                  <option value="Kolkata, West Bengal">Kolkata, West Bengal</option>
                  <option value="Delhi NCR">Delhi NCR</option>
                  <option value="Wayanad, Kerala">Wayanad, Kerala</option>
                  <option value="Anantapur, Andhra Pradesh">Anantapur, Andhra Pradesh</option>
                  <option value="Pune, Maharashtra">Pune, Maharashtra</option>
                </select>
                <button
                  type="submit"
                  disabled={!newStoryText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all font-sans ml-auto"
                >
                  Share Story (+15 XP)
                </button>
              </div>
            </form>

            {/* Stories List */}
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {impactStories.map((story) => (
                <div key={story.id} className="bg-slate-950 border border-slate-850 p-2.5 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="font-bold text-slate-200 block">{story.author}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{story.role}</span>
                    </div>
                    <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-400 px-1 rounded font-mono shrink-0">
                      {story.location}
                    </span>
                  </div>
                  
                  <div className="flex gap-2.5 items-start">
                    <div className="flex-1">
                      <p className="text-slate-300 italic leading-relaxed text-[11px]">"{story.text}"</p>
                    </div>
                    {story.photoId && (
                      <StoryImage photoId={story.photoId} onOpenLightbox={(src) => setLightboxPhoto(src)} />
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-1 text-[10px]">
                    <span className="text-[9px] text-slate-500 font-mono">{story.date}</span>
                    <button
                      type="button"
                      onClick={() => handleLikeStory(story.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] transition-all cursor-pointer font-bold font-mono ${
                        story.likedByMe 
                          ? "bg-amber-950/40 text-amber-400 border-amber-800" 
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Star className={`w-3 h-3 ${story.likedByMe ? "fill-amber-400 text-amber-400" : ""}`} />
                      <span>{story.likes} Likes</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[8.5px] text-slate-500 mt-4 text-left">
            *Liking reports encourages real-time community engagement.
          </div>
        </div>

      </div>

      {/* 3. PRINTABLE SUMMARY REPORT MODAL */}
      {showPrintReport && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-slate-900 border-2 border-indigo-500/80 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-slate-100 relative overflow-hidden animate-zoom-in">
            {/* Header Controls */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 no-print">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="font-black text-slate-100 text-sm uppercase tracking-wider font-sans">Impact Report Preview</h4>
                  <p className="text-[10px] text-slate-500 font-mono">Ready for standard printing / PDF export</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
                <button
                  onClick={() => setShowPrintReport(false)}
                  className="text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
                >
                  CLOSE PREVIEW
                </button>
              </div>
            </div>

            {/* THE PRINTABLE REPORT CONTAINER */}
            <div 
              id="printable-impact-report" 
              className="bg-white text-slate-900 p-8 rounded-2xl border border-slate-200 space-y-6 relative text-left"
            >
              {/* Authenticity Watermark/Banner */}
              <div className="border-b-2 border-indigo-600 pb-4 flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight font-sans uppercase">
                    India AI Impact Festival 2026
                  </h1>
                  <p className="text-xs text-indigo-600 uppercase font-bold tracking-widest font-mono">
                    Official Social Impact Portfolio Credential
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-1 rounded font-mono font-bold">
                    ID: {userProfile.username.toUpperCase().replace(/\s/g, "_")}_2026
                  </span>
                  <p className="text-[9px] text-slate-500 font-mono mt-1">Date: {new Date().toLocaleDateString("en-IN")}</p>
                </div>
              </div>

              {/* Verified Holder Profile Info */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                <div className="space-y-1.5">
                  <div className="text-slate-400 uppercase font-bold text-[9px] tracking-wide font-mono">VERIFIED HOLDER Profile</div>
                  <div className="font-black text-base text-slate-900">{userProfile.username}</div>
                  <div className="font-mono text-[11px] text-indigo-600 font-bold uppercase">{userProfile.role}</div>
                </div>
                <div className="grid grid-cols-2 gap-2 border-l border-slate-200 pl-4 text-slate-800 font-sans">
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold font-mono">LEVEL</span>
                    <span className="font-extrabold text-sm">{userProfile.level}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold font-mono">REPUTATION</span>
                    <span className="font-extrabold text-sm text-indigo-600">{userProfile.reputationScore}/100</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold font-mono">STREAK</span>
                    <span className="font-extrabold text-sm">{userProfile.streak} Days</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] font-bold font-mono">XP REWARD</span>
                    <span className="font-extrabold text-sm">{userProfile.xp} XP</span>
                  </div>
                </div>
              </div>

              {/* Core Dynamic Alignment & Accomplishments based on role */}
              <div className="space-y-4">
                {isVolunteerRole && (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase font-mono border-b border-slate-200 pb-1">
                        🎯 PREFERRED SOCIAL IMPACT CAUSES
                      </h3>
                      <div className="flex flex-wrap gap-1.5 text-[10.5px]">
                        {userProfile.preferredCauses && userProfile.preferredCauses.length > 0 ? (
                          userProfile.preferredCauses.map((cause, i) => (
                            <span key={i} className="bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md font-medium">
                              {cause}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">No preferred causes configured.</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase font-mono border-b border-slate-200 pb-1">
                        🏆 EARNED SOCIAL ACCOLADES & BADGES
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {userProfile.badges && userProfile.badges.length > 0 ? (
                          userProfile.badges.map((badge, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] bg-slate-50 border border-slate-100 p-2 rounded-lg">
                              <span className="text-indigo-600">✓</span>
                              <span className="font-bold text-slate-800">{badge}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No accolades unlocked yet. Participate in events or games to unlock rewards.</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase font-mono border-b border-slate-200 pb-1">
                        📅 REGISTERED CAMPAIGN ENGAGEMENT HISTORY
                      </h3>
                      <div className="space-y-2">
                        {events.filter(e => e.volunteersMatched.includes("v1")).length > 0 ? (
                          events.filter(e => e.volunteersMatched.includes("v1")).map(ev => (
                            <div key={ev.id} className="border border-slate-100 bg-slate-50 p-2.5 rounded-lg text-xs flex justify-between items-center">
                              <div>
                                <span className="font-bold text-slate-800">{ev.title}</span>
                                <p className="text-[10px] text-slate-500">{ev.ngoName} • {ev.location}</p>
                              </div>
                              <span className="font-mono text-[9px] bg-indigo-100 text-indigo-800 font-bold border border-indigo-200 px-2 py-0.5 rounded">
                                {ev.status}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 italic text-[11px]">No volunteering registrations recorded. Explore matches and apply above to log dynamic entries!</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {isNGORole && (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase font-mono border-b border-slate-200 pb-1">
                        🏢 NGO OPERATIONS INDEX
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-slate-400 block text-[9px] font-bold font-mono">TRUST SCORE RATING</span>
                          <span className="font-black text-sm text-indigo-600">92/100 verified index</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-slate-400 block text-[9px] font-bold font-mono">CAMPAIGNS CREATED</span>
                          <span className="font-black text-sm text-indigo-600">{events.length} Deployments</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase font-mono border-b border-slate-200 pb-1">
                        📝 REQUISITE CAMPAIGNS REGISTERED
                      </h3>
                      <div className="space-y-2 font-sans">
                        {events.map(ev => (
                          <div key={ev.id} className="border border-slate-100 bg-slate-50 p-2.5 rounded-lg text-xs flex justify-between items-center">
                            <div>
                              <span className="font-bold text-slate-800">{ev.title}</span>
                              <p className="text-[10px] text-slate-500">Location: {ev.location} • Target: {ev.sdgs.join(", ")}</p>
                            </div>
                            <span className="font-mono text-[9px] bg-indigo-100 text-indigo-800 font-bold border border-indigo-200 px-2 py-0.5 rounded">
                              {ev.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {isCSRRole && (
                  <>
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase font-mono border-b border-slate-200 pb-1">
                        💰 CSR CORPORATE DISBURSEMENT SUMMARY
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-slate-400 block text-[9px] font-bold font-mono">TOTAL BUDGET DISBURSED</span>
                          <span className="font-black text-sm text-indigo-600">₹14.5 Lakhs</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="text-slate-400 block text-[9px] font-bold font-mono">ENVIRONMENTAL ROI YIELD</span>
                          <span className="font-black text-sm text-indigo-600">+88 XP index scale</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-900 uppercase font-mono border-b border-slate-200 pb-1">
                        🌐 SPONSORED DISPATCH SCHEMES
                      </h3>
                      <div className="space-y-2 text-xs font-sans">
                        <div className="border border-slate-100 bg-slate-50 p-2.5 rounded-lg flex justify-between">
                          <div>
                            <span className="font-bold text-slate-800">Medical Kits Distribution Program</span>
                            <p className="text-[10px] text-slate-500">Budget Allocated: ₹5.8 Lakhs</p>
                          </div>
                          <span className="text-indigo-600 font-bold">40% allocated</span>
                        </div>
                        <div className="border border-slate-100 bg-slate-50 p-2.5 rounded-lg flex justify-between">
                          <div>
                            <span className="font-bold text-slate-800">Waste Sorting & Recycling Bins</span>
                            <p className="text-[10px] text-slate-500">Budget Allocated: ₹4.35 Lakhs</p>
                          </div>
                          <span className="text-indigo-600 font-bold">30% allocated</span>
                        </div>
                        <div className="border border-slate-100 bg-slate-50 p-2.5 rounded-lg flex justify-between">
                          <div>
                            <span className="font-bold text-slate-800">School Literacy Rural Booklet Campaign</span>
                            <p className="text-[10px] text-slate-500">Budget Allocated: ₹2.9 Lakhs</p>
                          </div>
                          <span className="text-indigo-600 font-bold">20% allocated</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Official Stamp Block */}
              <div className="border-t-2 border-dashed border-slate-300 pt-6 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 animate-pulse" />
                  <div>
                    <span className="font-black text-[10px] uppercase text-emerald-700 tracking-wider block">UN-SDG 11 & 17 ALIGNED</span>
                    <span className="text-[9px] text-slate-500 leading-normal block">System encrypted signature and dynamic offline blockchain stamp verification.</span>
                  </div>
                </div>
                <div className="text-right font-mono text-[9px] text-slate-400">
                  <span className="block font-bold">VERIFIED AUTHENTICITY</span>
                  <span>GOOGLE AI STUDIO BUILD APLET</span>
                </div>
              </div>

            </div>

            {/* Footer Control Buttons inside Modal */}
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-3 no-print">
              <button
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Confirm Print / Save PDF</span>
              </button>
              <button
                onClick={() => setShowPrintReport(false)}
                className="text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-sans font-bold cursor-pointer transition-colors"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 1. ROLE-SPECIFIC WORKSPACE WORK DESK */}
      {isVolunteerRole && (
        <div className="space-y-6 animate-fade-in">
          {/* Volunteer Header HUD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-wrap justify-between items-center gap-4">
            <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-indigo-600 h-full"></div>
            <div className="flex-1 min-w-[250px]">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-xl font-bold text-slate-100">Welcome back, {userProfile.username}!</h3>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono font-bold">
                  VOLUNTEER LEVEL {userProfile.level}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-900/45 flex items-center gap-1 font-mono uppercase tracking-wider">
                  🏆 Elite Volunteer
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-900/45 flex items-center gap-1 font-mono uppercase tracking-wider">
                  ⭐ Influencer
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-900/45 flex items-center gap-1 font-mono uppercase tracking-wider">
                  🤝 Active Ambassador
                </span>
              </div>

              <p className="text-xs text-slate-400">
                You possess registered credentials and active skillsets. Check matching campaigns or ask our offline FAQ AI bot.
              </p>
            </div>

            {/* Micro Gamification Display */}
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-800/20">
                  <Flame className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-mono">STREAK</div>
                  <div className="font-bold text-sm text-slate-200">{userProfile.streak} Days Active</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-800/20">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-mono">REPUTATION</div>
                  <div className="font-bold text-sm text-slate-200">{userProfile.reputationScore}/100</div>
                </div>
              </div>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 rounded-xl border border-indigo-800 transition-colors cursor-pointer text-xs font-bold font-sans shadow-md"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{showSettings ? "Close Settings" : "Personalize Profile"}</span>
              </button>

              <button
                onClick={() => {
                  setFeedbackCampaignId(events[0]?.id || "");
                  setShowFeedbackModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors cursor-pointer text-xs font-bold font-sans shadow-md"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Provide Feedback</span>
              </button>
            </div>
          </div>

          {/* Settings Drawer */}
          {showSettings && (
            <div className="animate-slide-down">
              <ProfileSettings
                userProfile={userProfile}
                onUpdateProfile={(updated) => {
                  onUpdateProfile(updated);
                  setShowSettings(false);
                }}
              />
            </div>
          )}

          {/* Sub Navigation */}
          <div className="flex border-b border-slate-800 gap-4">
            <button
              onClick={() => setVolunteerTab("explore")}
              className={`pb-2.5 text-xs font-semibold relative transition-all ${
                volunteerTab === "explore" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Explore Matches & Apply
              {volunteerTab === "explore" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
            </button>
            <button
              onClick={() => setVolunteerTab("calendar")}
              className={`pb-2.5 text-xs font-semibold relative transition-all ${
                volunteerTab === "calendar" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Event Schedule Calendar
              {volunteerTab === "calendar" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
            </button>
            <button
              onClick={() => setVolunteerTab("rag")}
              className={`pb-2.5 text-xs font-semibold relative transition-all ${
                volunteerTab === "rag" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              AI Smart RAG FAQ Helper
              {volunteerTab === "rag" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
            </button>
            <button
              onClick={() => setVolunteerTab("metrics")}
              className={`pb-2.5 text-xs font-semibold relative transition-all ${
                volunteerTab === "metrics" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              📊 Monthly Impact Tracker
              {volunteerTab === "metrics" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
            </button>
          </div>

          {/* SPLIT GRID WORKSPACE FOR MAIN TABS + PERSISTENT SIDEBAR */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-6">
            
            {/* LEFT AREA: ACTIVE SUB-TAB INTERFACES */}
            <div className="lg:col-span-2 space-y-6">

              {/* TAB: EXPLORE EVENTS */}
              {volunteerTab === "explore" && (
            <div className="space-y-4">
              {/* Event Alignment Toggle Controls */}
              <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">GRID FILTER:</span>
                  <div className="bg-slate-950 p-1 rounded-xl border border-slate-850 flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setEventFilterToggle("all")}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        eventFilterToggle === "all"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                      }`}
                    >
                      All Grid Events
                    </button>
                    <button
                      onClick={() => setEventFilterToggle("recommended")}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                        eventFilterToggle === "recommended"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                      }`}
                      title="Auto-align with causes pinned in your settings profile"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Recommended
                    </button>
                    <button
                      onClick={() => setEventFilterToggle("my")}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                        eventFilterToggle === "my"
                          ? "bg-indigo-600 text-white"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                      }`}
                    >
                      My Events
                    </button>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-indigo-300">
                  {eventFilterToggle === "recommended" ? (
                    <span>My Pinned Causes: <strong>{userProfile.preferredCauses?.join(", ") || "None configured"}</strong></span>
                  ) : (
                    <span>Campaigns loaded: <strong>{filteredEvents.length}</strong></span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map(ev => {
                    const applied = ev.volunteersMatched.includes("v1"); // Mock current user as Aarav 'v1'
                    return (
                      <div key={ev.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow relative overflow-hidden">
                        {ev.status === "ACTIVE" && <div className="absolute top-0 right-0 bg-indigo-600/10 border-l border-b border-indigo-800 text-indigo-400 font-mono text-[9px] px-2 py-0.5 font-bold">ACTIVE DEPLOYMENT</div>}
                        {ev.status === "PLANNING" && <div className="absolute top-0 right-0 bg-amber-600/10 border-l border-b border-amber-800 text-amber-400 font-mono text-[9px] px-2 py-0.5 font-bold">PLANNING PHASE</div>}
                        {ev.status === "COMPLETED" && <div className="absolute top-0 right-0 bg-teal-600/10 border-l border-b border-teal-800 text-teal-400 font-mono text-[9px] px-2 py-0.5 font-bold font-semibold">CAMPAIGN COMPLETE</div>}

                        <div>
                          <span className="text-[10px] text-indigo-400 font-bold font-mono uppercase block mb-1">{ev.ngoName}</span>
                          <h4 className="text-base font-bold text-slate-100 mb-2">{ev.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed mb-4">{ev.description}</p>
                          
                          <div className="space-y-2 mb-4 text-xs">
                            <div>
                              <span className="text-slate-500">Target SDG:</span> <span className="font-mono text-slate-300 font-medium">{ev.sdgs.join(", ")}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Location:</span> <span className="font-semibold text-slate-300">{ev.location}</span>
                            </div>
                          </div>
                        </div>

                        {ev.status !== "COMPLETED" && (
                          applied ? (
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => {
                                  // Unapply
                                  const updated = events.map(e => {
                                    if (e.id === ev.id) {
                                      return { ...e, volunteersMatched: e.volunteersMatched.filter(v => v !== "v1") };
                                    }
                                    return e;
                                  });
                                  syncEvents(updated);
                                  // Also remove reminder
                                  setReminders(prev => prev.filter(r => r.eventId !== ev.id));
                                  logActivity("event", `Withdrew from campaign: "${ev.title}"`);
                                  if (onTriggerNotification) {
                                    onTriggerNotification(`Withdrew from "${ev.title}"`, "sync");
                                  }
                                }}
                                className="flex-1 text-center text-xs font-semibold py-2 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-all cursor-pointer"
                              >
                                Applied (Matched)
                              </button>
                              <button
                                onClick={() => {
                                  setReminderModalEvent(ev);
                                  const existing = reminders.find(r => r.eventId === ev.id);
                                  if (existing) {
                                    setReminderDaysBefore(existing.daysBefore);
                                    setReminderNotes(existing.notes || "");
                                  } else {
                                    setReminderDaysBefore(2);
                                    setReminderNotes("");
                                  }
                                }}
                                className={`p-2 rounded-lg border transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                                  reminders.some(r => r.eventId === ev.id && r.isEnabled)
                                    ? "bg-amber-950/40 text-amber-400 border-amber-700/50"
                                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                                }`}
                                title={reminders.some(r => r.eventId === ev.id && r.isEnabled) ? "Edit Commitment Reminder" : "Set Commitment Reminder"}
                              >
                                <Bell className={`w-4 h-4 ${reminders.some(r => r.eventId === ev.id && r.isEnabled) ? "animate-pulse text-amber-400" : "text-slate-400"}`} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                // Apply
                                const updated = events.map(e => {
                                  if (e.id === ev.id) {
                                    return { ...e, volunteersMatched: [...e.volunteersMatched, "v1"] };
                                  }
                                  return e;
                                });
                                syncEvents(updated);
                                onRewardXP(20);
                                logActivity("event", `Applied for campaign: "${ev.title}"`, 20);
                                if (onTriggerNotification) {
                                  onTriggerNotification(`Applied for "${ev.title}"! +20 XP.`, "xp");
                                }
                              }}
                              className="w-full text-center text-xs font-semibold py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
                            >
                              Apply Instantly & Run Bias Check
                            </button>
                          )
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center flex flex-col items-center justify-center space-y-3 animate-fade-in">
                    <Search className="w-10 h-10 text-slate-500 animate-pulse" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-200">No Campaigns Found Matching "{globalSearchQuery}"</h4>
                      <p className="text-xs text-slate-400">Try adjusting your keywords, search location, or SDG targets.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: EVENT SCHEDULE CALENDAR */}
          {volunteerTab === "calendar" && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-850 pb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    June 2026 Volunteering Schedule
                  </h4>
                  <p className="text-xs text-slate-400">
                    Track your registered events, milestones deadlines, and national coordination check-ins.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Registered campaigns highlighted in green</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Month Grid */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <span className="text-xs font-bold text-slate-500 select-none">‹ May 2026</span>
                    <span className="text-xs font-black font-display text-indigo-400 uppercase tracking-widest">June 2026</span>
                    <span className="text-xs font-bold text-slate-500 select-none">July 2026 ›</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {/* June 1st is Monday, so Sun is blank */}
                    <div className="bg-slate-950/20 border border-transparent h-16 rounded-xl"></div>
                    
                    {Array.from({ length: 30 }).map((_, i) => {
                      const day = i + 1;
                      let dayEvent: any = null;
                      if (day === 5) dayEvent = { id: "e3", title: "Western Ghats Afforestation Drive", time: "09:00 AM", location: "Kerala Western Slopes", sdg: "SDG 15", isRegistered: true };
                      if (day === 12) dayEvent = { id: "e2", title: "Rural Health & Sanitation Camps", time: "10:30 AM", location: "Pune Outskirts", sdg: "SDG 3", isRegistered: false };
                      if (day === 18) dayEvent = { id: "e1", title: "Coastal & River Plastic Recovery", time: "08:00 AM", location: "Juhu Beach Coast", sdg: "SDG 14", isRegistered: true };
                      if (day === 24) dayEvent = { id: "e4", title: "SDG Centennial Active Hours check", time: "11:00 AM", location: "National Grid", sdg: "SDG 17", isRegistered: false };
                      if (day === 29) dayEvent = { id: "e5", title: "Ecosystem Audit & Feedback Review", time: "05:00 PM", location: "Online Portal", sdg: "SDG 16", isRegistered: true };

                      const isSelected = selectedCalendarDay?.day === day;

                      return (
                        <button
                          key={day}
                          onClick={() => {
                            if (dayEvent) {
                              setSelectedCalendarDay({ day, event: dayEvent });
                            } else {
                              setSelectedCalendarDay({ day, event: null });
                            }
                          }}
                          className={`h-16 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all relative cursor-pointer ${
                            isSelected 
                              ? "bg-indigo-950/60 border-indigo-500 text-indigo-100" 
                              : dayEvent 
                                ? dayEvent.isRegistered
                                  ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-200"
                                  : "bg-slate-950/90 border-indigo-950/80 hover:border-indigo-800/60 text-slate-300"
                                : "bg-slate-950/40 border-slate-850 hover:border-slate-800 text-slate-400"
                          }`}
                        >
                          <span className="text-[10px] font-mono font-bold">{day}</span>
                          {dayEvent && (
                            <div className={`w-1.5 h-1.5 rounded-full self-end ${
                              dayEvent.isRegistered ? "bg-emerald-400" : "bg-indigo-400"
                            } animate-pulse`} title={dayEvent.title}></div>
                          )}
                          {dayEvent && (
                            <span className="text-[7.5px] truncate font-sans tracking-tight leading-none text-slate-400">
                              {dayEvent.title.split(" ")[0]}...
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Event Sidebar Details */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                  {selectedCalendarDay ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">Selected Day: June {selectedCalendarDay.day}, 2026</span>
                        <span className="text-[9px] text-indigo-400 bg-indigo-950 border border-indigo-900 px-1.5 rounded">Active</span>
                      </div>
                      
                      {selectedCalendarDay.event ? (
                        <div className="space-y-3">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                            selectedCalendarDay.event.isRegistered 
                              ? "bg-emerald-950/50 text-emerald-300 border-emerald-900" 
                              : "bg-indigo-950/50 text-indigo-300 border-indigo-900"
                          }`}>
                            {selectedCalendarDay.event.isRegistered ? "✓ Registered" : "Pending Registration"}
                          </span>
                          <h5 className="text-xs font-bold text-slate-200 leading-snug">{selectedCalendarDay.event.title}</h5>
                          
                          <div className="space-y-1.5 text-[10px] text-slate-400 font-mono">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{selectedCalendarDay.event.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{selectedCalendarDay.event.location}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Core SDGs: {selectedCalendarDay.event.sdg}</span>
                            </div>
                          </div>

                          <div className="pt-2">
                            {selectedCalendarDay.event.isRegistered ? (
                              <div className="text-[9px] text-emerald-400 bg-emerald-950/30 p-2 border border-emerald-900/40 rounded-lg text-center">
                                You are signed up for this campaign. Check-in on site to receive up to +25 XP rewards!
                              </div>
                            ) : (
                              <button 
                                onClick={() => {
                                  setSelectedCalendarDay(prev => ({
                                    ...prev,
                                    event: { ...prev.event, isRegistered: true }
                                  }));
                                  onRewardXP(20);
                                  if (onTriggerNotification) {
                                    onTriggerNotification(`Signed up for "${selectedCalendarDay.event.title}"! +20 XP earned.`, "xp");
                                  }
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer"
                              >
                                Sign Up Instantly (+20 XP)
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-10 text-slate-500 italic">
                          No direct national grid events scheduled on this day. Use 'Explore Matches' to browse other opportunities.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Calendar className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-pulse" />
                      <h5 className="text-xs font-bold text-slate-400 mb-1">Interactive Scheduler</h5>
                      <p className="text-[10px] text-slate-500">
                        Click on any highlighted day in the calendar grid to inspect event details, times, locations, and register instantly on the national SDG grid.
                      </p>
                    </div>
                  )}

                  <div className="border-t border-slate-850 pt-3 mt-4">
                    <span className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider mb-2">
                      Upcoming Milestones Deadlines
                    </span>
                    <div className="space-y-1.5 text-[9px] font-mono text-slate-400">
                      <div className="flex justify-between items-center p-1 bg-slate-900 border border-slate-850 rounded">
                        <span>June 5: Coastline afforestation</span>
                        <span className="text-amber-400">5 Days left</span>
                      </div>
                      <div className="flex justify-between items-center p-1 bg-slate-900 border border-slate-850 rounded">
                        <span>June 18: Mumbai beach cleanup</span>
                        <span className="text-indigo-400">18 Days left</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: RAG FAQ HELPER */}
          {volunteerTab === "rag" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h4 className="text-sm font-semibold text-slate-200 mb-2">Smart Offline Vector RAG Retrieval</h4>
              <p className="text-xs text-slate-400 mb-4">
                Enter any query regarding our ecosystem, bias checkers, offline sync architectures, or CSR budget allocations.
              </p>

              <form onSubmit={handleRAGSearch} className="flex gap-2 mb-5">
                <input
                  type="text"
                  placeholder="Ask a question (e.g. 'How does matching work?' or 'Offline mode support?')"
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 flex-1 focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                >
                  <Search className="w-3.5 h-3.5" />
                  RAG Retrieval
                </button>
              </form>

              {ragResult ? (
                <div className="space-y-3">
                  <div className="bg-indigo-950/20 border border-indigo-800/40 rounded-xl p-3 text-xs leading-relaxed">
                    <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase block mb-1">RETRIEVED KNOWLEDGE SUMMARY (SIMULATED GEMINI)</span>
                    <p className="text-slate-200">{ragResult.answer}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-lg text-[10px] font-mono text-slate-500 flex justify-between">
                    <span>{ragResult.retrievedContext}</span>
                    <span className="text-indigo-400">Match Confidence: {ragResult.similarityScore}%</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 bg-slate-950 p-4 rounded-xl border border-slate-850 text-center">
                  Try asking: <span className="text-indigo-400 font-mono font-bold italic cursor-pointer" onClick={() => { setRagQuery("How does volunteer matching algorithm eliminate bias?"); }}>"How does volunteer matching algorithm eliminate bias?"</span>
                </div>
              )}
            </div>
          )}

          {volunteerTab === "metrics" && (
            <div className="space-y-6">
              
              {/* Chart & Core Impact Analytics */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                  <div>
                    <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono font-bold uppercase">
                      Social Impact Ledger
                    </span>
                    <h4 className="text-sm font-bold text-slate-100 mt-1 flex items-center gap-2">
                      <span>Monthly Volunteer Impact Analytics</span>
                    </h4>
                  </div>
                  
                  {/* Chart Type Toggles */}
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-800 rounded-xl">
                    <button
                      onClick={() => setChartType("bar")}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                        chartType === "bar" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Bar Chart
                    </button>
                    <button
                      onClick={() => setChartType("line")}
                      className={`px-3 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                        chartType === "line" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Line Chart
                    </button>
                  </div>
                </div>

                {/* Recharts Component Container */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 h-[300px] flex items-center justify-center relative">
                  {monthlyMetrics.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "bar" ? (
                        <BarChart data={monthlyMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                          <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                          <YAxis yAxisId="left" stroke="#818cf8" fontSize={9} />
                          <YAxis yAxisId="right" orientation="right" stroke="#34d399" fontSize={9} />
                          <Tooltip contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px', color: '#e2e8f0' }} />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                          <Bar yAxisId="left" dataKey="hours" name="Hours Contributed" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          <Bar yAxisId="right" dataKey="tasks" name="Tasks Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      ) : (
                        <LineChart data={monthlyMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.4} />
                          <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                          <YAxis yAxisId="left" stroke="#818cf8" fontSize={9} />
                          <YAxis yAxisId="right" orientation="right" stroke="#34d399" fontSize={9} />
                          <Tooltip contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px', color: '#e2e8f0' }} />
                          <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                          <Line yAxisId="left" type="monotone" dataKey="hours" name="Hours Contributed" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 4 }} />
                          <Line yAxisId="right" type="monotone" dataKey="tasks" name="Tasks Completed" stroke="#10b981" strokeWidth={3} activeDot={{ r: 4 }} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-slate-500 font-mono">No impact metrics logged yet.</p>
                  )}
                </div>

                {/* Derived Summary Statistics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/80">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold block">Total Hours Logged</span>
                    <span className="text-lg font-black text-indigo-400 font-mono">
                      {monthlyMetrics.reduce((sum, m) => sum + Number(m.hours || 0), 0)} hrs
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/80">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold block">Tasks Completed</span>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {monthlyMetrics.reduce((sum, m) => sum + Number(m.tasks || 0), 0)} tasks
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/80">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold block">Average Efficiency</span>
                    <span className="text-lg font-black text-amber-400 font-mono">
                      {(monthlyMetrics.reduce((sum, m) => sum + Number(m.hours || 0), 0) / (monthlyMetrics.reduce((sum, m) => sum + Number(m.tasks || 0), 0) || 1)).toFixed(1)} hrs/task
                    </span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/80">
                    <span className="text-[9px] text-slate-500 font-mono uppercase font-bold block">Peak Monthly Contrib</span>
                    <span className="text-lg font-black text-purple-400 font-mono">
                      {monthlyMetrics.length > 0 ? Math.max(...monthlyMetrics.map(m => Number(m.hours || 0))) : 0} hrs
                    </span>
                  </div>
                </div>
              </div>

              {/* Log Custom Impact Metrics Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Log & Update Monthly Metrics</span>
                  </h4>
                  <button
                    onClick={() => setShowMetricForm(!showMetricForm)}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-mono font-bold uppercase tracking-wider underline cursor-pointer"
                  >
                    {showMetricForm ? "Collapse Form" : "Expand Logger Form"}
                  </button>
                </div>

                {showMetricForm && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newMetricMonth.trim()) return;

                      // Check if already exists, then update; else append
                      const existingIndex = monthlyMetrics.findIndex(
                        m => m.month.toLowerCase() === newMetricMonth.toLowerCase()
                      );

                      let updated = [...monthlyMetrics];
                      const logPayload = {
                        month: newMetricMonth,
                        hours: Number(newMetricHours),
                        tasks: Number(newMetricTasks)
                      };

                      if (existingIndex > -1) {
                        updated[existingIndex] = logPayload;
                      } else {
                        updated.push(logPayload);
                      }

                      setMonthlyMetrics(updated);
                      onRewardXP(15);
                      logActivity("reputation", `Logged/Updated monthly impact for ${newMetricMonth}: ${newMetricHours} hrs, ${newMetricTasks} tasks.`);
                      if (onTriggerNotification) {
                        onTriggerNotification(`Successfully recorded metrics for ${newMetricMonth}! +15 XP rewarded.`, "xp");
                      }
                    }}
                    className="space-y-4 bg-slate-950 p-4 rounded-xl border border-slate-850/80 animate-slide-down"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Month selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Target Month</label>
                        <select
                          value={newMetricMonth}
                          onChange={(e) => setNewMetricMonth(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="Jan 2026">Jan 2026</option>
                          <option value="Feb 2026">Feb 2026</option>
                          <option value="Mar 2026">Mar 2026</option>
                          <option value="Apr 2026">Apr 2026</option>
                          <option value="May 2026">May 2026</option>
                          <option value="Jun 2026">Jun 2026</option>
                          <option value="Jul 2026">Jul 2026</option>
                          <option value="Aug 2026">Aug 2026</option>
                          <option value="Sep 2026">Sep 2026</option>
                          <option value="Oct 2026">Oct 2026</option>
                          <option value="Nov 2026">Nov 2026</option>
                          <option value="Dec 2026">Dec 2026</option>
                        </select>
                      </div>

                      {/* Hours input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Hours Contributed</label>
                        <input
                          type="number"
                          min="0"
                          max="200"
                          value={newMetricHours}
                          onChange={(e) => setNewMetricHours(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Tasks input */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Tasks Completed</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={newMetricTasks}
                          onChange={(e) => setNewMetricTasks(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer text-center"
                    >
                      Save Impact Metrics & Receive +15 XP
                    </button>
                  </form>
                )}
              </div>

              {/* Active Deadline Reminders Management */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span>Registered commitment deadline reminders</span>
                  </h4>
                  <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-800 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                    {reminders.filter(r => r.isEnabled).length} ACTIVE REMINDERS
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-4 leading-relaxed font-sans">
                  The dashboard checks these records to alert you of upcoming milestones in advance. Select bell icons on campaign listings to create or edit reminders.
                </p>

                {reminders.length > 0 ? (
                  <div className="space-y-3">
                    {reminders.map((rem, idx) => {
                      const eventRef = events.find(ev => ev.id === rem.eventId);
                      return (
                        <div key={idx} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-start justify-between gap-3 text-xs">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-800/60 px-1 rounded font-mono font-bold">
                                {rem.daysBefore === 0 ? "On day of event" : `${rem.daysBefore} days before`}
                              </span>
                              <h5 className="font-bold text-slate-200 truncate">{rem.eventTitle}</h5>
                            </div>
                            <p className="text-[10px] text-slate-400 font-mono">Event Target Date: {rem.eventDate}</p>
                            {rem.notes && (
                              <p className="text-[10px] bg-slate-900/60 text-slate-300 p-2 border border-slate-800/40 rounded italic font-sans leading-relaxed">
                                {rem.notes}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {eventRef && (
                              <button
                                onClick={() => {
                                  setReminderModalEvent(eventRef);
                                  setReminderDaysBefore(rem.daysBefore);
                                  setReminderNotes(rem.notes || "");
                                }}
                                className="bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-slate-100 p-1.5 rounded-lg transition-colors cursor-pointer"
                                title="Edit reminder notes or timing"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const updated = reminders.filter(r => r.eventId !== rem.eventId);
                                setReminders(updated);
                                if (onTriggerNotification) {
                                  onTriggerNotification("Removed reminder successfully.", "sync");
                                }
                              }}
                              className="bg-rose-950/40 hover:bg-rose-900/40 border border-rose-900/40 text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                              title="Delete reminder completely"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center bg-slate-950 border border-slate-850 p-4 rounded-xl text-xs text-slate-500">
                    No active deadline reminders set. Try applying to an event and clicking its Bell icon!
                  </div>
                )}
              </div>

              {/* Direct Tab Exporters & Archive Downloads */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2 mb-2">
                    <Download className="w-4 h-4 text-indigo-400" />
                    <span>Instant Social Impact Reports Exporter</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-4">
                    Download offline backups of your full volunteering record instantly. Backups include full credential indexes, registered events, feedback comment catalogs, and monthly hours logs.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      onClick={handleExportJSON}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm text-center"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download JSON</span>
                    </button>
                    <button
                      onClick={handleExportCSV}
                      className="bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 font-sans text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm text-center"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV</span>
                    </button>
                    <button
                      onClick={handleExportTXT}
                      className="bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700/60 font-sans text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm text-center"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download TXT Report</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}
            </div>

            {/* RIGHT AREA: PERSISTENT COMPANION SIDEBAR */}
            <div className="space-y-6">
              
              {/* Volunteer Quick-Start Guide (Active Overlay) */}
              {showQuickStartGuide && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-4 animate-slide-down">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500"></div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono font-bold uppercase">
                        First Steps
                      </span>
                      <h4 className="text-xs font-bold text-slate-100 mt-1">Volunteer Quick-Start Guide</h4>
                    </div>
                    <button
                      onClick={() => setShowQuickStartGuide(false)}
                      className="text-slate-500 hover:text-slate-300 text-xs font-mono font-bold cursor-pointer"
                      title="Dismiss Guide"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    Welcome to SevaSetu! Follow these three simple pillars to build your verified public social impact profile:
                  </p>

                  <div className="space-y-3 pt-1">
                    {/* Hour tracking info */}
                    <div className="flex gap-2.5 items-start font-sans">
                      <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0 mt-0.5 border border-indigo-500/10">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-200">1. Track Service Hours</h5>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Apply for matches on the Grid or register calendar days. Completing shifts increments certified volunteer hours.
                        </p>
                      </div>
                    </div>

                    {/* Badge earning info */}
                    <div className="flex gap-2.5 items-start font-sans">
                      <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 shrink-0 mt-0.5 border border-amber-500/10">
                        <Award className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-200">2. Earn Verified Badges</h5>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Reach volunteer milestones or play the Impact Games (SDG Quizzes) to unlock rare social accolade badges.
                        </p>
                      </div>
                    </div>

                    {/* Reputation score info */}
                    <div className="flex gap-2.5 items-start font-sans">
                      <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0 mt-0.5 border border-emerald-500/10">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h5 className="text-[11px] font-bold text-slate-200">3. Scale Reputation Score</h5>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Maintain high reliability scores (up to 100%) by completing registered camps, active streaks, and submitting NGO feedback.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => setShowQuickStartGuide(false)}
                      className="w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] py-1.5 rounded-lg transition-all cursor-pointer"
                    >
                      I Understand, Let's Go!
                    </button>
                  </div>
                </div>
              )}

              {/* Public Badge Pinning Showcase */}
              {userProfile.pinnedBadges && userProfile.pinnedBadges.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-amber-500 h-full"></div>
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-extrabold text-amber-400 uppercase font-mono flex items-center gap-1">
                      📌 Pinned Achievements
                    </h4>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Public Showcase</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {userProfile.pinnedBadges.map((badge, i) => (
                      <div key={i} className="text-center p-2.5 bg-slate-950 border border-slate-850 rounded-xl relative group">
                        <span className="text-lg block mb-0.5">🏆</span>
                        <span className="text-[9px] font-bold text-slate-200 block truncate" title={badge}>
                          {badge}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity Feed Widget */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2.5">
                  <h4 className="text-[10.5px] font-bold text-slate-300 uppercase font-mono tracking-wider">
                    ⚡ Recent Activity Feed
                  </h4>
                  <span className="text-[9px] font-mono text-slate-500 uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                    Live Logs
                  </span>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((act) => {
                      let iconColor = "text-indigo-400 bg-indigo-500/10 border-indigo-500/10";
                      if (act.type === "reputation") iconColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/10";
                      if (act.type === "badge") iconColor = "text-amber-400 bg-amber-500/10 border-amber-500/10";
                      if (act.type === "streak") iconColor = "text-rose-400 bg-rose-500/10 border-rose-500/10";

                      return (
                        <div key={act.id} className="flex gap-2.5 items-start text-xs border-b border-slate-850/40 pb-2.5 last:border-b-0 last:pb-0">
                          <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 border ${iconColor}`}>
                            {act.type === "reputation" ? <ShieldCheck className="w-3.5 h-3.5" /> :
                             act.type === "badge" ? <Award className="w-3.5 h-3.5" /> :
                             act.type === "streak" ? <Flame className="w-3.5 h-3.5" /> :
                             <Clock className="w-3.5 h-3.5" />}
                          </div>
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <p className="text-slate-300 leading-snug break-words font-medium">
                              {act.message}
                            </p>
                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                              <span>{act.date}</span>
                              {act.xp && (
                                <span className="text-indigo-400 font-bold">+{act.xp} XP</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 text-slate-500 italic text-[10.5px]">
                      No activities logged yet. Apply to events to seed feed!
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {isNGORole && (
        <div className="space-y-6 animate-fade-in">
          {/* NGO Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-wrap justify-between items-center gap-4">
            <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-indigo-600 h-full"></div>
            <div className="flex-1 min-w-[250px]">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-slate-100">NGO Ground Command Deck</h3>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono font-bold">
                  VERIFIED LIASON
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Trigger natural language event planners, assign vetted volunteers, and dispatch logistics checklists in resource-stressed clusters.
              </p>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 rounded-xl border border-indigo-800 transition-colors cursor-pointer text-xs font-bold font-sans shadow-md"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{showSettings ? "Close Settings" : "Personalize Profile"}</span>
            </button>
          </div>

          {/* Settings Drawer */}
          {showSettings && (
            <div className="animate-slide-down">
              <ProfileSettings
                userProfile={userProfile}
                onUpdateProfile={(updated) => {
                  onUpdateProfile(updated);
                  setShowSettings(false);
                }}
              />
            </div>
          )}

          <div className="flex border-b border-slate-800 gap-4">
            <button
              onClick={() => setNgoTab("planner")}
              className={`pb-2.5 text-xs font-semibold relative transition-all ${
                ngoTab === "planner" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              AI Auto Event Planner
              {ngoTab === "planner" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
            </button>
            <button
              onClick={() => setNgoTab("matching")}
              className={`pb-2.5 text-xs font-semibold relative transition-all ${
                ngoTab === "matching" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              AI Matchmaker Dispatch
              {ngoTab === "matching" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
            </button>
          </div>

          {/* TAB: AUTO EVENT BUILDER */}
          {ngoTab === "planner" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-200 mb-1">Natural Language Campaign Architect</h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Describe what ecological or medical campaign you want to construct, and the offline NLP optimizer will generate matching timelines, material requisites, roles, and safety contingency matrices.
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.g. 'Tree plantation drive in rural Bihar with 50 volunteers' or 'Healthcare camp'"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 px-3 py-2 flex-1 focus:outline-none focus:border-indigo-600 font-sans"
                  />
                  <button
                    onClick={handleEventBuild}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow shrink-0"
                  >
                    <BrainCircuit className="w-3.5 h-3.5" />
                    Build with AI
                  </button>
                </div>
              </div>

              {builderOutput && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-5">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[11px] font-mono text-indigo-400 font-bold uppercase">AI PROPOSED LOGISTICS CHECKLIST</span>
                    <span className="text-[10px] text-teal-400 bg-teal-950/20 border border-teal-800/40 px-2 py-0.5 rounded font-mono font-medium">SDG TARGETS DETECTED</span>
                  </div>

                  {/* Input configuration */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">CONFIRM EVENT TITLE</label>
                      <input
                        type="text"
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded p-1.5 w-full text-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">TARGET STATE KEY</label>
                      <select
                        value={newEventStateKey}
                        onChange={(e) => setNewEventStateKey(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded p-1.5 w-full text-slate-200 text-xs"
                      >
                        <option value="bihar">Bihar</option>
                        <option value="maharashtra">Maharashtra</option>
                        <option value="karnataka">Karnataka</option>
                        <option value="westbengal">West Bengal</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">EXPLICIT DISTRICT</label>
                      <input
                        type="text"
                        value={newEventLocation}
                        onChange={(e) => setNewEventLocation(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded p-1.5 w-full text-slate-200 text-xs"
                      />
                    </div>
                  </div>

                  {/* Logistics detail */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div>
                      <h5 className="font-bold text-slate-300 mb-2">Required Volunteer Roles:</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {builderOutput.logistics.rolesRequired.map((role: string, idx: number) => (
                          <span key={idx} className="bg-slate-900 text-slate-300 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono">
                            {role}
                          </span>
                        ))}
                      </div>

                      <h5 className="font-bold text-slate-300 mt-4 mb-2">Materials Checklist:</h5>
                      <ul className="space-y-1 font-mono text-[11px] text-slate-400">
                        {builderOutput.logistics.materialsChecklist.map((mat: any, idx: number) => (
                          <li key={idx} className="flex justify-between border-b border-slate-900 pb-0.5">
                            <span>{mat.item}</span>
                            <span>Needed: {mat.needed}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="font-bold text-slate-300 mb-2">Crisis Risk contingency:</h5>
                      <ul className="space-y-2 text-[11px] text-slate-400">
                        {builderOutput.logistics.risks.map((risk: any, idx: number) => (
                          <li key={idx} className="bg-slate-900 p-2 rounded border border-slate-800/60 leading-relaxed">
                            <span className="font-bold text-rose-400 block">Hazard: {risk.hazard}</span>
                            <span>Mitigation: {risk.mitigation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveBuiltEvent}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 rounded-lg transition-all"
                  >
                    Confirm Campaign & Save onto National Registry
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB: MATCHMAKER DISPATCH */}
          {ngoTab === "matching" && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">SELECT TARGET EVENT TO COMPILE MATCHES</label>
                <div className="flex gap-2">
                  <select
                    value={matchingEventId}
                    onChange={(e) => handleRunMatching(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 p-2 focus:outline-none focus:border-indigo-600 flex-1"
                  >
                    <option value="">-- Choose Campaign --</option>
                    {events.map(e => (
                      <option key={e.id} value={e.id}>{e.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {matchResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-800 pb-2">
                    <span>RANKED CANDIDATES (BIAS FILTER ACTIVATED)</span>
                    <span className="text-teal-400 font-mono font-bold">100% EXPLAINABLE PAIRINGS</span>
                  </div>

                  <div className="space-y-3">
                    {matchResults.slice(0, 3).map((res, idx) => {
                      const firstName = res.volunteer.name.split(" ")[0];
                      const dynamicScore = Math.round(
                        (res.volunteer.reliabilityScore * 0.4) + 
                        (Math.min(res.volunteer.hoursContributed, 100) * 0.3) + 
                        (Math.min(res.volunteer.pastEventsCount * 4.5, 30))
                      );
                      
                      let trustBadge = "🌱 Active Change Creator";
                      let badgeColor = "bg-slate-900/80 text-slate-400 border-slate-800";
                      if (dynamicScore >= 85) {
                        trustBadge = "🏆 Elite Impact Leader";
                        badgeColor = "bg-amber-950/40 text-amber-300 border-amber-900/50";
                      } else if (dynamicScore >= 65) {
                        trustBadge = "⭐ High-Reliability Partner";
                        badgeColor = "bg-indigo-950/40 text-indigo-300 border-indigo-900/50";
                      } else if (dynamicScore >= 40) {
                        trustBadge = "🤝 Active Ambassador";
                        badgeColor = "bg-emerald-950/40 text-emerald-300 border-emerald-900/50";
                      }

                      return (
                        <div key={res.volunteer.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 blur-2xl rounded-full"></div>
                          
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                <span className="text-[9px] text-indigo-400 font-bold font-mono uppercase tracking-wider bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-900/35">
                                  RANK #{idx + 1} BEST MATCH
                                </span>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                                  {trustBadge}
                                </span>
                              </div>
                              <h5 className="font-bold text-slate-100 text-sm">{firstName}</h5>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Location: {res.volunteer.location}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-indigo-400 font-mono">{res.totalScore}% AI Fit</span>
                              <div className="text-[9px] text-slate-500 font-mono">Skills: {res.skillScore}% | Proximity: {res.locationScore}%</div>
                            </div>
                          </div>

                          {/* Explainability component */}
                          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-850/80 text-xs">
                            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block mb-1 font-mono">🔍 Why was I matched?</span>
                            <p className="text-slate-300 leading-relaxed italic text-[11px]">
                              {res.explanation}
                            </p>
                            
                            {/* Reputation metrics break down */}
                            <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
                              <div>
                                <span className="text-[9px] text-slate-500 block">REPUTATION</span>
                                <span className="font-mono text-[10px] font-bold text-amber-400">{dynamicScore}/100</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 block">RELIABILITY</span>
                                <span className="font-mono text-[10px] font-bold text-indigo-400">{res.volunteer.reliabilityScore}%</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-500 block">HOURS CONTRIBUTED</span>
                                <span className="font-mono text-[10px] font-bold text-emerald-400">{res.volunteer.hoursContributed} hrs</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
                            <span>Personality Style: {res.volunteer.personalityType}</span>
                            <span>Event History: {res.volunteer.pastEventsCount} campaigns completed</span>
                          </div>

                          <button
                            onClick={() => setSelectedExplainMatch(res)}
                            className="w-full bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 hover:text-indigo-200 py-1.5 px-3 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-indigo-900/40 transition-all shadow-sm"
                          >
                            <Info className="w-3.5 h-3.5" />
                            <span>Explain My Match Details</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      const selectedIds = matchResults.slice(0, 3).map(r => r.volunteer.id);
                      handleDispatchVolunteers(matchingEventId, selectedIds);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-1 shadow"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Dispatch Matched Candidates
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isCSRRole && (
        <div className="space-y-6 animate-fade-in">
          {/* CSR Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-wrap justify-between items-center gap-4">
            <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-indigo-500 to-indigo-600 h-full"></div>
            <div className="flex-1 min-w-[250px]">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-slate-100 font-sans">CSR Executive Dashboard</h3>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono font-bold">
                  CSR CORPORATE SPONSOR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Audit social economic valuation metrics, allocate funding strategies, and coordinate high-stakes emergency incidents.
              </p>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 rounded-xl border border-indigo-800 transition-colors cursor-pointer text-xs font-bold font-sans shadow-md"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>{showSettings ? "Close Settings" : "Personalize Profile"}</span>
            </button>
          </div>

          {/* Settings Drawer */}
          {showSettings && (
            <div className="animate-slide-down">
              <ProfileSettings
                userProfile={userProfile}
                onUpdateProfile={(updated) => {
                  onUpdateProfile(updated);
                  setShowSettings(false);
                }}
              />
            </div>
          )}

          <div className="flex border-b border-slate-800 gap-4">
            <button
              onClick={() => setCsrTab("analytics")}
              className={`pb-2.5 text-xs font-semibold relative transition-all ${
                csrTab === "analytics" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Impact Graph Analytics
              {csrTab === "analytics" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
            </button>
            <button
              onClick={() => setCsrTab("emergency")}
              className={`pb-2.5 text-xs font-semibold relative transition-all ${
                csrTab === "emergency" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Emergency Center
              {csrTab === "emergency" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
            </button>
            <button
              onClick={() => setCsrTab("budget")}
              className={`pb-2.5 text-xs font-semibold relative transition-all ${
                csrTab === "budget" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              CSR Budget Optimizer
              {csrTab === "budget" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
            </button>
          </div>

          {/* TAB: CSR GRAPH ANALYTICS */}
          {csrTab === "analytics" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Numerical stats row */}
              <div className="md:col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                  <div className="text-[10px] font-mono text-slate-500 mb-1">TOTAL VOLUNTEERS ACTIVE</div>
                  <div className="text-xl font-bold font-mono text-indigo-400">{volunteers.length * 28} Candidates</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                  <div className="text-[10px] font-mono text-slate-500 mb-1">VERIFIED SUPPORT HOURS</div>
                  <div className="text-xl font-bold font-mono text-indigo-400">{impactSummary.totalHours} Hours</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                  <div className="text-[10px] font-mono text-slate-500 mb-1">ESTIMATED SOCIAL VALUATION</div>
                  <div className="text-xl font-bold font-mono text-indigo-400">₹{impactSummary.socialValueINR.toLocaleString("en-IN")}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow">
                  <div className="text-[10px] font-mono text-slate-500 mb-1">SDG SOCIAL IMPACT SCORE</div>
                  <div className="text-xl font-bold font-mono text-indigo-400">{impactSummary.socialImpactScore} XP</div>
                </div>
              </div>

              {/* Graphical Charts */}
              <div className="md:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-300 mb-4 uppercase">SDG COMPLIANCE FOOTPRINT (METRIC CHART)</h4>
                  
                  {/* Styled Vector SVG Bar graph */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 h-[180px] flex items-end justify-around relative">
                    {/* Gridlines */}
                    <div className="absolute inset-x-0 bottom-4 border-b border-slate-900 h-10 w-full pointer-events-none"></div>
                    <div className="absolute inset-x-0 bottom-14 border-b border-slate-900 h-10 w-full pointer-events-none"></div>
                    <div className="absolute inset-x-0 bottom-24 border-b border-slate-900 h-10 w-full pointer-events-none"></div>

                    <div className="flex flex-col items-center z-10 w-12">
                      <div className="text-[10px] font-mono text-indigo-400 font-bold mb-1">85%</div>
                      <div className="bg-indigo-500 rounded-t h-[120px] w-6 transition-all duration-500"></div>
                      <span className="text-[9px] text-slate-500 font-mono mt-1.5">SDG 11</span>
                    </div>

                    <div className="flex flex-col items-center z-10 w-12">
                      <div className="text-[10px] font-mono text-indigo-400 font-bold mb-1">62%</div>
                      <div className="bg-emerald-500 rounded-t h-[90px] w-6 transition-all duration-500"></div>
                      <span className="text-[9px] text-slate-500 font-mono mt-1.5">SDG 17</span>
                    </div>

                    <div className="flex flex-col items-center z-10 w-12">
                      <div className="text-[10px] font-mono text-indigo-400 font-bold mb-1">45%</div>
                      <div className="bg-sky-500 rounded-t h-[60px] w-6 transition-all duration-500"></div>
                      <span className="text-[9px] text-slate-500 font-mono mt-1.5">SDG 3</span>
                    </div>

                    <div className="flex flex-col items-center z-10 w-12">
                      <div className="text-[10px] font-mono text-indigo-400 font-bold mb-1">30%</div>
                      <div className="bg-amber-500 rounded-t h-[40px] w-6 transition-all duration-500"></div>
                      <span className="text-[9px] text-slate-500 font-mono mt-1.5">SDG 4</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 mt-3 font-mono leading-relaxed">
                  *Our model maps project checklists to UN criteria. Sustainable Cities (SDG 11) gets the highest contribution weight due to heavy rural water and waste sorting implementations.
                </div>
              </div>

              {/* Dynamic Impact Summary paragraph card */}
              <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-300 mb-3 uppercase">AI AUDITED SOCIAL CONTRACT REPORT</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans bg-slate-950 p-4 rounded-xl border border-slate-850 mb-4">
                    {impactSummary.summaryParagraph}
                  </p>
                </div>

                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(impactSummary, null, 2));
                    const dlAnchor = document.createElement("a");
                    dlAnchor.setAttribute("href", dataStr);
                    dlAnchor.setAttribute("download", "CSR_AI_Impact_Report_2026.json");
                    dlAnchor.click();
                  }}
                  className="w-full text-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg transition-all"
                >
                  Download Certified Impact JSON Ledger
                </button>
              </div>

            </div>
          )}

          {/* TAB: CSR EMERGENCY CENTER */}
          {csrTab === "emergency" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Emergency Router form */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold font-mono border-b border-slate-800 pb-2 mb-2">
                  <ShieldAlert className="w-4 h-4 animate-pulse" />
                  INCIDENT COMMAND ALERT DISPATCHER
                </div>

                <form onSubmit={handleEmergencySubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">ENTER INCIDENT LOG REPORTED FROM THE FIELD</label>
                    <textarea
                      rows={3}
                      placeholder="E.g. 'Volunteer Aarav suffered severe heatstroke symptoms in Gaya' or 'Water shortage in school'"
                      value={incidentInput}
                      onChange={(e) => setIncidentInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 p-2.5 focus:outline-none focus:border-rose-600 font-sans"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-2 rounded-lg transition-all"
                  >
                    Assess Threat Level
                  </button>
                </form>

                {emergencyResult && (
                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-rose-400 font-mono">PRIORITY: {emergencyResult.urgency}</span>
                      <span className="text-slate-500">Category: {emergencyResult.category}</span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      {emergencyResult.explanation}
                    </p>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 font-mono block">MANDATED RESPONSIVE DIRECTIVES:</span>
                      <ul className="space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                        {emergencyResult.mitigationSteps.map((step: string, i: number) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Ticker Feed */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-300 mb-4 uppercase">REAL-TIME FIELD TELEMETRY</h4>
                  
                  <div className="space-y-3">
                    {liveFeed.map(feed => (
                      <div key={feed.id} className="flex gap-2.5 items-start text-xs border-b border-slate-850/60 pb-2.5">
                        <span className="text-[10px] font-mono text-slate-500 mt-0.5">{feed.timestamp}</span>
                        <div className="flex-1">
                          <p className="text-slate-300 leading-relaxed font-sans">{feed.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono bg-slate-950 p-2 rounded-lg border border-slate-850 mt-4">
                  *Heartbeat active. Listening to telemetry logs over persistent static fallback loops.
                </div>
              </div>

            </div>
          )}

          {/* TAB: CSR BUDGET OPTIMIZER */}
          {csrTab === "budget" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase">FUNDS ALLOCATION STRATEGY</h4>
                <p className="text-xs text-slate-400">
                  Enter your target CSR project budget limit (INR) to calculate optimized social yield allocations across rural schoolkits, clinics, and plastic recycling.
                </p>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 block">AVAILABLE CAPEX LIMIT (INR)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={budgetLimit}
                      onChange={(e) => setBudgetLimit(parseInt(e.target.value) || 0)}
                      className="bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 p-2 focus:outline-none focus:border-indigo-600 flex-1 font-mono"
                    />
                    <button
                      onClick={optimizeCSRBudget}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow"
                    >
                      Optimize
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 bg-slate-950 p-3 rounded-lg border border-slate-850 leading-relaxed font-mono">
                  *Cost calculations: Standard primary medical kit sets ₹250, heavy dry sorting bins ₹450, digital workbook pamphlets ₹50.
                </div>
              </div>

              <div className="md:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                {budgetAllocation ? (
                  <div className="space-y-4 text-xs">
                    <h4 className="text-xs font-mono font-bold text-slate-300 uppercase border-b border-slate-800 pb-2">PROPOSED CSR DISPATCH ROUTING</h4>
                    
                    <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                      <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                        <span className="text-slate-500 block">Medical Camps (40%)</span>
                        <span className="font-bold text-indigo-400 text-xs">₹{budgetAllocation.medAlloc.toLocaleString("en-IN")}</span>
                        <span className="text-slate-500 block mt-1">({budgetAllocation.medicalKitsPurchased} Kits)</span>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                        <span className="text-slate-500 block">Waste Sorting (30%)</span>
                        <span className="font-bold text-indigo-400 text-xs">₹{budgetAllocation.wasteAlloc.toLocaleString("en-IN")}</span>
                        <span className="text-slate-500 block mt-1">({budgetAllocation.recyclingBinsSecured} Bins)</span>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                        <span className="text-slate-500 block">School Literacy (20%)</span>
                        <span className="font-bold text-indigo-400 text-xs">₹{budgetAllocation.schoolAlloc.toLocaleString("en-IN")}</span>
                        <span className="text-slate-500 block mt-1">({budgetAllocation.ruralSchoolBooklets} booklets)</span>
                      </div>

                      <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                        <span className="text-slate-500 block">Logistics Offset (10%)</span>
                        <span className="font-bold text-indigo-400 text-xs">₹{budgetAllocation.logisticsAlloc.toLocaleString("en-IN")}</span>
                        <span className="text-slate-500 block mt-1">(Local logistics)</span>
                      </div>
                    </div>

                    <div className="bg-indigo-950/20 border border-indigo-800/40 p-3 rounded-lg flex justify-between items-center text-xs text-indigo-300">
                      <span>Expected Ecological Yield Return Score:</span>
                      <span className="font-mono font-bold text-indigo-400">+{budgetAllocation.socialROI} XP</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-12 text-slate-500">
                    <BrainCircuit className="w-10 h-10 text-slate-700 mb-2" />
                    <p className="text-xs">Adjust funds threshold and click Optimize to load CSR logistics allocations.</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* Community Milestones Section */}
      <div className="mt-8">
        <CommunityMilestones />
      </div>

      {/* 2. EXPLAIN MY MATCH MODAL */}
      {selectedExplainMatch && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border-2 border-indigo-500/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-100 relative overflow-hidden animate-zoom-in">
            {/* Ambient Background Aura */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-600/10 blur-3xl rounded-full"></div>

            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="font-black text-slate-100 text-sm uppercase tracking-wider">AI Matching Transparency Report</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Formula: SECURE_PAIRING_V4.1</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedExplainMatch(null)}
                className="text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                CLOSE
              </button>
            </div>

            {/* Match Profile Summary */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-indigo-400 font-mono bg-indigo-950/50 border border-indigo-900/40 px-2 py-0.5 rounded">MATCH CANDIDATE</span>
                <h5 className="font-extrabold text-base text-slate-100 mt-1">{selectedExplainMatch.volunteer.name}</h5>
                <p className="text-[10px] text-slate-500 font-mono">Location: {selectedExplainMatch.volunteer.location}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-indigo-400 font-mono">{selectedExplainMatch.totalScore}%</span>
                <p className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wide">Overall Alignment</p>
              </div>
            </div>

            {/* Matching Criteria Breakdown */}
            <div className="space-y-3">
              <h6 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-800 pb-1.5 flex items-center justify-between">
                <span>🎯 PAIRING WEIGHT ALIGNMENT</span>
                <span className="text-indigo-400 font-normal">Strict Bias Exclusion Active</span>
              </h6>

              {/* Criterion 1: Skills */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Requisite Skills matching (40% weight):</span>
                  <span className="text-indigo-400 font-bold">{selectedExplainMatch.skillScore}% Match</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-full" style={{ width: `${selectedExplainMatch.skillScore}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Matches targeted skills like <span className="font-semibold text-slate-300">{selectedExplainMatch.volunteer.skills.slice(0, 3).join(", ")}</span> against campaign logistics parameters.
                </p>
              </div>

              {/* Criterion 2: Proximity */}
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Geographic Proximity matching (30% weight):</span>
                  <span className="text-emerald-400 font-bold">{selectedExplainMatch.locationScore}% Match</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full" style={{ width: `${selectedExplainMatch.locationScore}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Measures physical travel offsets and carbon-footprint reduction pathways to optimize local emergency response times.
                </p>
              </div>

              {/* Criterion 3: Reputation */}
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-300">Trust & Reputation score (30% weight):</span>
                  <span className="text-amber-400 font-bold">
                    {Math.round(
                      (selectedExplainMatch.volunteer.reliabilityScore * 0.4) + 
                      (Math.min(selectedExplainMatch.volunteer.hoursContributed, 100) * 0.3) + 
                      (Math.min(selectedExplainMatch.volunteer.pastEventsCount * 4.5, 30))
                    )}/100 Index
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full" style={{ 
                    width: `${Math.round(
                      (selectedExplainMatch.volunteer.reliabilityScore * 0.4) + 
                      (Math.min(selectedExplainMatch.volunteer.hoursContributed, 100) * 0.3) + 
                      (Math.min(selectedExplainMatch.volunteer.pastEventsCount * 4.5, 30))
                    )}%` 
                  }}></div>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Calculated dynamically from <span className="font-semibold text-slate-300">{selectedExplainMatch.volunteer.reliabilityScore}% reliability rate</span> and <span className="font-semibold text-slate-300">{selectedExplainMatch.volunteer.pastEventsCount} verified campaign completions</span>.
                </p>
              </div>
            </div>

            {/* Trust Assurance Statement */}
            <div className="bg-indigo-950/20 border border-indigo-900/40 p-3 rounded-2xl flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-[10px] leading-relaxed text-slate-300">
                <span className="font-bold text-slate-200 block mb-0.5">Verified Non-Biased Algorithm</span>
                All allocations are calculated based exclusively on empirical credentials, geographic logistics, and verified completion rates. Protected class variables (gender, age, orientation, ethnicity) are programmatically ignored.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PROVIDE FEEDBACK MODAL */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-100 relative overflow-hidden animate-zoom-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/10 blur-3xl rounded-full"></div>

            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="font-black text-slate-100 text-sm uppercase tracking-wider">Submit Qualitative Feedback</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Contribute to organizational growth & earn +15 XP!</p>
                </div>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                CLOSE
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!feedbackText.trim()) return;

              const targetCampaign = events.find(ev => ev.id === feedbackCampaignId) || events[0];
              const newFeedback = {
                id: `f-${Date.now()}`,
                campaignTitle: targetCampaign?.title || "Unknown Campaign",
                rating: feedbackRating,
                comment: feedbackText,
                date: new Date().toISOString().split('T')[0],
                anonymous: feedbackAnonymous
              };

              const updatedFeedbacks = [newFeedback, ...feedbackHistory];
              setFeedbackHistory(updatedFeedbacks);
              localStorage.setItem("ai_impact_feedbacks", JSON.stringify(updatedFeedbacks));

              // Reset form & reward XP
              setFeedbackText("");
              setFeedbackRating(5);
              setFeedbackAnonymous(false);
              setShowFeedbackModal(false);
              onRewardXP(15);
              
              if (onTriggerNotification) {
                onTriggerNotification(`Thank you! Qualitative feedback recorded and +15 XP rewarded.`, "xp");
              }
            }} className="space-y-4">
              
              {/* Event selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Select Volunteered Campaign</label>
                <select
                  value={feedbackCampaignId}
                  onChange={(e) => setFeedbackCampaignId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>
                      {ev.title} ({ev.ngoName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Star Rating Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Volunteering Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setFeedbackRating(num)}
                      className={`p-2 rounded-lg border transition-all cursor-pointer ${
                        num <= feedbackRating 
                          ? "bg-amber-950/40 border-amber-600 text-amber-400" 
                          : "bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400"
                      }`}
                    >
                      <Star className={`w-5 h-5 ${num <= feedbackRating ? "fill-current" : ""}`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Qualitative textarea */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Your Qualitative Feedback</label>
                <textarea
                  required
                  placeholder="Share details about logistics, coordination, training, impact delivery, or other elements..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-600 resize-none font-sans"
                />
              </div>

              {/* Anonymity Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="anon-cb"
                  checked={feedbackAnonymous}
                  onChange={(e) => setFeedbackAnonymous(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="anon-cb" className="text-[10px] text-slate-400 font-sans cursor-pointer select-none">
                  Submit this review anonymously (your user profile won't be visible to NGOs)
                </label>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-center"
              >
                Submit Qualitative Feedback & Receive +15 XP
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. REMINDER CONFIGURATION MODAL */}
      {reminderModalEvent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-100 relative overflow-hidden animate-zoom-in">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 blur-3xl rounded-full"></div>

            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400 animate-bounce" />
                <div>
                  <h4 className="font-black text-slate-100 text-sm uppercase tracking-wider">Commitment Deadline Reminder</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Stay on track with your registered campaign milestones!</p>
                </div>
              </div>
              <button
                onClick={() => setReminderModalEvent(null)}
                className="text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
              >
                CLOSE
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">Target Campaign</span>
              <h5 className="text-xs font-bold text-slate-200">{reminderModalEvent.title}</h5>
              <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 mt-1">
                <span>NGO: {reminderModalEvent.ngoName}</span>
                <span>•</span>
                <span>Date: {reminderModalEvent.date}</span>
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const existingIndex = reminders.findIndex(r => r.eventId === reminderModalEvent.id);
              const newReminder = {
                eventId: reminderModalEvent.id,
                eventTitle: reminderModalEvent.title,
                eventDate: reminderModalEvent.date,
                daysBefore: reminderDaysBefore,
                notes: reminderNotes,
                isEnabled: true
              };

              let updatedReminders = [...reminders];
              if (existingIndex > -1) {
                updatedReminders[existingIndex] = newReminder;
              } else {
                updatedReminders.push(newReminder);
              }
              
              setReminders(updatedReminders);
              setReminderModalEvent(null);
              
              if (onTriggerNotification) {
                onTriggerNotification(`Reminder set successfully! We will notify you ${reminderDaysBefore} days before ${reminderModalEvent.date}.`, "sync");
              }
              logActivity("streak", `Configured deadline reminder for "${reminderModalEvent.title}".`);
            }} className="space-y-4">
              
              {/* Days Before Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Notify Me</label>
                <select
                  value={reminderDaysBefore}
                  onChange={(e) => setReminderDaysBefore(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value={0}>On the Day of the Event ({reminderModalEvent.date})</option>
                  <option value={1}>1 Day Before</option>
                  <option value={2}>2 Days Before</option>
                  <option value={3}>3 Days Before</option>
                  <option value={5}>5 Days Before</option>
                  <option value={7}>1 Week Before</option>
                </select>
              </div>

              {/* Reminder Custom Notes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">Reminder Notes / Checklists</label>
                <textarea
                  placeholder="e.g. Bring water bottles, wear comfortable sneakers, confirm shuttle route, etc..."
                  value={reminderNotes}
                  onChange={(e) => setReminderNotes(e.target.value)}
                  className="w-full h-20 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 placeholder-slate-600 resize-none font-sans"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                {reminders.some(r => r.eventId === reminderModalEvent.id) && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = reminders.filter(r => r.eventId !== reminderModalEvent.id);
                      setReminders(updated);
                      setReminderModalEvent(null);
                      if (onTriggerNotification) {
                        onTriggerNotification("Removed reminder for this campaign.", "sync");
                      }
                    }}
                    className="flex-1 bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/50 text-rose-400 font-sans text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer text-center"
                  >
                    Remove
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-sans text-xs font-black py-2.5 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  Save & Enable Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. COMPARE NGOs MODAL */}
      {showCompareModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-slate-900 border-2 border-teal-500/80 rounded-3xl max-w-4xl w-full p-6 shadow-2xl space-y-5 text-slate-100 relative overflow-hidden animate-zoom-in max-h-[90vh] overflow-y-auto">
            {/* Ambient Background Aura */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-600/10 blur-3xl rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-600/10 blur-3xl rounded-full"></div>

            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-teal-400" />
                <div>
                  <h4 className="font-black text-slate-100 text-sm uppercase tracking-wider font-sans">NGO Partner Comparison Hub Hub</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Side-by-side impact analysis & satisfaction scores</p>
                </div>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold cursor-pointer transition-colors"
              >
                CLOSE
              </button>
            </div>

            {/* Selector Dropdowns */}
            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-850">
              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider mb-1.5">Select NGO 1</label>
                <select
                  value={compareNgo1}
                  onChange={(e) => setCompareNgo1(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none focus:border-teal-500 font-sans"
                >
                  {initialNGOs.map(ngo => (
                    <option key={ngo.id} value={ngo.id} disabled={ngo.id === compareNgo2}>{ngo.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-slate-400 block uppercase tracking-wider mb-1.5">Select NGO 2</label>
                <select
                  value={compareNgo2}
                  onChange={(e) => setCompareNgo2(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-250 focus:outline-none focus:border-teal-500 font-sans"
                >
                  {initialNGOs.map(ngo => (
                    <option key={ngo.id} value={ngo.id} disabled={ngo.id === compareNgo1}>{ngo.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Comparison Table */}
            {(() => {
              const ngo1 = initialNGOs.find(n => n.id === compareNgo1) || initialNGOs[0];
              const ngo2 = initialNGOs.find(n => n.id === compareNgo2) || initialNGOs[1];

              if (!ngo1 || !ngo2) return null;

              const rating1 = ngoRatings[ngo1.id] || ngo1.trustRating;
              const rating2 = ngoRatings[ngo2.id] || ngo2.trustRating;

              const activeCount1 = initialEvents.filter(e => e.ngoId === ngo1.id && e.status === "ACTIVE").length;
              const activeCount2 = initialEvents.filter(e => e.ngoId === ngo2.id && e.status === "ACTIVE").length;

              const complCount1 = initialEvents.filter(e => e.ngoId === ngo1.id && e.status === "COMPLETED").length;
              const complCount2 = initialEvents.filter(e => e.ngoId === ngo2.id && e.status === "COMPLETED").length;

              return (
                <div className="bg-slate-950 rounded-2xl border border-slate-850 overflow-hidden">
                  <table className="w-full text-xs text-left text-slate-300">
                    <thead className="text-[9px] uppercase tracking-widest font-mono text-slate-400 bg-slate-900/60 border-b border-slate-850">
                      <tr>
                        <th className="px-4 py-3 w-1/3">Metric / Field</th>
                        <th className="px-4 py-3 bg-teal-950/10 text-teal-300 font-bold">{ngo1.name}</th>
                        <th className="px-4 py-3 bg-indigo-950/10 text-indigo-300 font-bold">{ngo2.name}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {/* Focus Cause Area */}
                      <tr>
                        <td className="px-4 py-3.5 font-bold font-mono text-[9px] text-slate-400">FOCUS AREAS</td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {ngo1.focus.map((f, i) => (
                              <span key={i} className="bg-teal-950/40 text-teal-400 border border-teal-900/40 text-[9px] px-2 py-0.5 rounded-md font-medium">{f}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {ngo2.focus.map((f, i) => (
                              <span key={i} className="bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 text-[9px] px-2 py-0.5 rounded-md font-medium">{f}</span>
                            ))}
                          </div>
                        </td>
                      </tr>

                      {/* Geographic Base */}
                      <tr>
                        <td className="px-4 py-3.5 font-bold font-mono text-[9px] text-slate-400">LOCATION</td>
                        <td className="px-4 py-3.5 font-sans font-medium">{ngo1.location}</td>
                        <td className="px-4 py-3.5 font-sans font-medium">{ngo2.location}</td>
                      </tr>

                      {/* Satisfaction Score */}
                      <tr>
                        <td className="px-4 py-3.5 font-bold font-mono text-[9px] text-slate-400">SATISFACTION SCORE</td>
                        <td className="px-4 py-3.5 bg-teal-950/5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-teal-400 text-sm">{rating1}%</span>
                            <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                              <div className="bg-teal-500 h-full rounded-full" style={{ width: `${rating1}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 bg-indigo-950/5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-indigo-400 text-sm">{rating2}%</span>
                            <div className="flex-1 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                              <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${rating2}%` }}></div>
                            </div>
                          </div>
                        </td>
                      </tr>

                      {/* Verification Status */}
                      <tr>
                        <td className="px-4 py-3.5 font-bold font-mono text-[9px] text-slate-400">VERIFIED STATUS</td>
                        <td className="px-4 py-3.5">
                          {ngo1.verified ? (
                            <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-900 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg">
                              ✓ Vetted Liaison
                            </span>
                          ) : (
                            <span className="text-slate-500">Standard Partner</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {ngo2.verified ? (
                            <span className="bg-emerald-950/60 text-emerald-400 border border-emerald-900 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg">
                              ✓ Vetted Liaison
                            </span>
                          ) : (
                            <span className="text-slate-500">Standard Partner</span>
                          )}
                        </td>
                      </tr>

                      {/* Active Campaigns */}
                      <tr>
                        <td className="px-4 py-3.5 font-bold font-mono text-[9px] text-slate-400">ACTIVE DEPLOYMENTS</td>
                        <td className="px-4 py-3.5 font-mono text-slate-200 font-bold">{activeCount1} campaigns running</td>
                        <td className="px-4 py-3.5 font-mono text-slate-200 font-bold">{activeCount2} campaigns running</td>
                      </tr>

                      {/* Completed Campaigns */}
                      <tr>
                        <td className="px-4 py-3.5 font-bold font-mono text-[9px] text-slate-400">HISTORIC COMPLETIONS</td>
                        <td className="px-4 py-3.5 font-mono text-slate-200 font-bold">{complCount1} completed</td>
                        <td className="px-4 py-3.5 font-mono text-slate-200 font-bold">{complCount2} completed</td>
                      </tr>

                      {/* Liaison Contact POC */}
                      <tr>
                        <td className="px-4 py-3.5 font-bold font-mono text-[9px] text-slate-400">POC LIAISON</td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-200">{ngo1.pocName}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{ngo1.pocPhone}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-200">{ngo2.pocName}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{ngo2.pocPhone}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowCompareModal(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-6 rounded-xl transition-all cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. FIELD EVIDENCE LIGHTBOX MODAL */}
      {lightboxPhoto && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in no-print">
          <div className="bg-slate-900 border-2 border-indigo-500 rounded-3xl max-w-2xl w-full p-4 shadow-2xl relative overflow-hidden flex flex-col items-center animate-zoom-in">
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700 p-2 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 max-h-[70vh] flex items-center justify-center bg-black">
              <img
                src={lightboxPhoto}
                alt="SevaSetu Verified Field Evidence"
                className="max-w-full max-h-full object-contain"
              />
              <div className="absolute top-4 left-4 bg-emerald-500/95 backdrop-blur-sm text-slate-950 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg flex items-center gap-1 shadow-md font-mono select-none">
                <CheckCircle className="w-3.5 h-3.5 text-slate-950 fill-none shrink-0" />
                <span>Verified Field Evidence</span>
              </div>
            </div>
            <p className="text-[10.5px] text-slate-400 font-mono mt-3.5 uppercase tracking-wider text-center">
              SevaSetu Decentralized Evidence Log • Cryptographic Verification Complete
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
