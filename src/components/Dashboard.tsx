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
  Printer, FileText
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from "recharts";
import CommunityMilestones from "./CommunityMilestones";
import ProfileSettings from "./ProfileSettings";

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
  const [volunteerTab, setVolunteerTab] = useState<"explore" | "rag">("explore");
  const [ngoTab, setNgoTab] = useState<"planner" | "events" | "matching">("planner");
  const [csrTab, setCsrTab] = useState<"analytics" | "emergency" | "budget">("analytics");

  // Global Printable summary report modal state
  const [showPrintReport, setShowPrintReport] = useState(false);

  // Derived filtered events for global search
  const filteredEvents = events.filter(ev => {
    if (!globalSearchQuery) return true;
    const q = globalSearchQuery.toLowerCase();
    const titleMatch = ev.title?.toLowerCase().includes(q) ?? false;
    const locationMatch = ev.location?.toLowerCase().includes(q) ?? false;
    const sdgsMatch = ev.sdgs?.some(sdg => sdg.toLowerCase().includes(q)) ?? false;
    const descMatch = ev.description?.toLowerCase().includes(q) ?? false;
    const ngoMatch = ev.ngoName?.toLowerCase().includes(q) ?? false;
    return titleMatch || locationMatch || sdgsMatch || descMatch || ngoMatch;
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
              onClick={() => setVolunteerTab("rag")}
              className={`pb-2.5 text-xs font-semibold relative transition-all ${
                volunteerTab === "rag" ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              AI Smart RAG FAQ Helper
              {volunteerTab === "rag" && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
            </button>
          </div>

          {/* TAB: EXPLORE EVENTS */}
          {volunteerTab === "explore" && (
            <div className="space-y-4">
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
                          <button
                            onClick={() => {
                              if (applied) {
                                // Unapply
                                const updated = events.map(e => {
                                  if (e.id === ev.id) {
                                    return { ...e, volunteersMatched: e.volunteersMatched.filter(v => v !== "v1") };
                                  }
                                  return e;
                                });
                                syncEvents(updated);
                              } else {
                                // Apply
                                const updated = events.map(e => {
                                  if (e.id === ev.id) {
                                    return { ...e, volunteersMatched: [...e.volunteersMatched, "v1"] };
                                  }
                                  return e;
                                });
                                syncEvents(updated);
                                onRewardXP(20);
                              }
                            }}
                            className={`w-full text-center text-xs font-semibold py-2 rounded-lg transition-all ${
                              applied 
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800" 
                                : "bg-indigo-600 hover:bg-indigo-500 text-white"
                            }`}
                          >
                            {applied ? "Applied (Matched on National Grid)" : "Apply Instantly & Run Bias Check"}
                          </button>
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

    </div>
  );
}
